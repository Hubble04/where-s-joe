'use client';

import {
  useEffect, useMemo, useState, useCallback, useRef,
  type ReactNode,
} from 'react';
import type {
  Profile, Cafe, Post, Comment, CafeSave, CustomList, SuggestedCafe,
  SaveType, Visibility, WeekHours,
} from './types';
import { getSupabaseBrowser } from './supabase/client';
import { StoreContext, type StoreValue } from './storeContext';

const uid = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// Row -> domain-type mappers (DB is snake_case, the app is camelCase)
// ---------------------------------------------------------------------------
function rowToProfile(r: any): Profile {
  return {
    id: r.id, name: r.name, username: r.username, email: r.email ?? undefined,
    bio: r.bio ?? '', profilePhotoUrl: r.profile_photo_url ?? '', location: r.location ?? '',
    role: r.role === 'admin' ? 'admin' : 'user', createdAt: r.created_at,
  };
}

function rowToCafe(r: any, tags: { category: string; tag: string }[]): Cafe {
  const byCategory = new Map<string, string[]>();
  tags.forEach((t) => { const a = byCategory.get(t.category) ?? []; a.push(t.tag); byCategory.set(t.category, a); });
  return {
    id: r.id, name: r.name, address: r.address ?? '', city: r.city ?? '', state: r.state ?? '', country: r.country ?? 'USA',
    lat: r.latitude, lng: r.longitude, description: r.description ?? '',
    website: r.website ?? undefined, instagram: r.instagram ?? undefined, phone: r.phone ?? undefined,
    coverPhotoUrl: r.cover_photo_url ?? '', gallery: r.gallery ?? [],
    verifiedByJoe: !!r.verified_by_joe, status: r.status, createdAt: r.created_at,
    neighborhood: r.neighborhood ?? '', tags: tags.map((t) => t.tag),
    tagsByCategory: Array.from(byCategory.entries()).map(([category, catTags]) => ({ category, tags: catTags })),
    signatureDrink: r.signature_drink ?? '', hours: r.hours ?? '',
    hoursStructured: (r.hours_json ?? undefined) as WeekHours | undefined,
    rating: r.rating != null ? Number(r.rating) : 0, reviewCount: r.review_count ?? 0,
    priceTier: (r.price_tier ?? 2) as 1 | 2 | 3,
  };
}

function rowToPost(r: any, photos: string[]): Post {
  return {
    id: r.id, userId: r.user_id, cafeId: r.cafe_id, caption: r.caption ?? '',
    drinkTag: r.drink_tag, visibility: r.visibility, createdAt: r.created_at,
    photos, likeCount: 0, commentCount: 0,
  };
}

function rowToComment(r: any): Comment {
  return { id: r.id, postId: r.post_id, userId: r.user_id, content: r.content, createdAt: r.created_at };
}

function rowToSave(r: any): CafeSave {
  return {
    id: r.id, userId: r.user_id, cafeId: r.cafe_id, saveType: r.save_type,
    note: r.note, orderedDrink: r.ordered_drink, milkType: r.milk_type, recommend: r.recommend,
    createdAt: r.created_at,
  };
}

function rowToSuggestion(r: any): SuggestedCafe {
  return {
    id: r.id, submittedBy: r.submitted_by, name: r.name, address: r.address ?? '', city: r.city ?? '',
    state: r.state ?? '', country: r.country ?? 'USA', description: r.description ?? '',
    website: r.website ?? undefined, instagram: r.instagram ?? undefined, photoUrl: r.photo_url ?? undefined,
    tags: r.tags ?? [], moderationStatus: r.moderation_status, createdAt: r.created_at,
  };
}

const FALLBACK_USER: Omit<Profile, 'id'> = {
  name: 'Unknown', username: 'unknown', bio: '', profilePhotoUrl: '', location: '',
  role: 'user', createdAt: new Date().toISOString(),
};

export function SupabaseStoreProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowser()!, []);

  const [meId, setMeId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [ready, setReady] = useState(false);
  const everReady = useRef(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeRows, setLikeRows] = useState<{ postId: string; userId: string }[]>([]);
  const [follows, setFollows] = useState<{ followerId: string; followingId: string }[]>([]);
  const [mySaves, setMySaves] = useState<CafeSave[]>([]);
  const [myLists, setMyLists] = useState<CustomList[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCafe[]>([]);

  // --- loaders ---------------------------------------------------------
  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error(error); return; }
    setProfiles((data ?? []).map(rowToProfile));
  }, [supabase]);

  const loadCafes = useCallback(async () => {
    const [{ data: cafeRows, error: e1 }, { data: tagRows, error: e2 }] = await Promise.all([
      supabase.from('cafes').select('*').order('name'),
      supabase.from('cafe_tags').select('*'),
    ]);
    if (e1) { console.error(e1); return; }
    if (e2) console.error(e2);
    const tagsByCafe = new Map<string, { category: string; tag: string }[]>();
    (tagRows ?? []).forEach((t: any) => {
      const arr = tagsByCafe.get(t.cafe_id) ?? [];
      arr.push({ category: t.category, tag: t.tag });
      tagsByCafe.set(t.cafe_id, arr);
    });
    setCafes((cafeRows ?? []).map((r: any) => rowToCafe(r, tagsByCafe.get(r.id) ?? [])));
  }, [supabase]);

  const loadPosts = useCallback(async () => {
    const { data: postRows, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    const ids = (postRows ?? []).map((p: any) => p.id);
    let photoRows: any[] = [], likeRowsData: any[] = [], commentRows: any[] = [];
    if (ids.length > 0) {
      const [{ data: ph }, { data: lk }, { data: cm }] = await Promise.all([
        supabase.from('post_photos').select('*').in('post_id', ids).order('position'),
        supabase.from('likes').select('*').in('post_id', ids),
        supabase.from('comments').select('*').in('post_id', ids),
      ]);
      photoRows = ph ?? []; likeRowsData = lk ?? []; commentRows = cm ?? [];
    }
    const photosByPost = new Map<string, string[]>();
    photoRows.forEach((r: any) => { const a = photosByPost.get(r.post_id) ?? []; a.push(r.image_url); photosByPost.set(r.post_id, a); });
    setPosts((postRows ?? []).map((r: any) => rowToPost(r, photosByPost.get(r.id) ?? [])));
    setLikeRows(likeRowsData.map((r: any) => ({ postId: r.post_id, userId: r.user_id })));
    setComments(commentRows.map(rowToComment));
  }, [supabase]);

  const loadFollows = useCallback(async () => {
    const { data, error } = await supabase.from('follows').select('*');
    if (error) { console.error(error); return; }
    setFollows((data ?? []).map((r: any) => ({ followerId: r.follower_id, followingId: r.following_id })));
  }, [supabase]);

  const loadSuggestions = useCallback(async () => {
    const { data, error } = await supabase.from('suggested_cafes').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setSuggestions((data ?? []).map(rowToSuggestion));
  }, [supabase]);

  const loadMySaves = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('user_cafe_saves').select('*').eq('user_id', userId);
    if (error) { console.error(error); return; }
    setMySaves((data ?? []).map(rowToSave));
  }, [supabase]);

  const loadMyLists = useCallback(async (userId: string) => {
    const { data: listRows, error } = await supabase.from('custom_lists').select('*').eq('user_id', userId);
    if (error) { console.error(error); return; }
    const ids = (listRows ?? []).map((l: any) => l.id);
    let itemRows: any[] = [];
    if (ids.length > 0) {
      const { data } = await supabase.from('custom_list_items').select('*').in('list_id', ids);
      itemRows = data ?? [];
    }
    const itemsByList = new Map<string, string[]>();
    itemRows.forEach((r: any) => { const a = itemsByList.get(r.list_id) ?? []; a.push(r.cafe_id); itemsByList.set(r.list_id, a); });
    setMyLists((listRows ?? []).map((r: any) => ({
      id: r.id, userId: r.user_id, name: r.name, description: r.description ?? '',
      createdAt: r.created_at, cafeIds: itemsByList.get(r.id) ?? [],
    })));
  }, [supabase]);

  // --- auth session ------------------------------------------------------
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }: any) => {
      if (!alive) return;
      setMeId(data.session?.user?.id ?? null);
      setAuthResolved(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setMeId(session?.user?.id ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  // --- data loading, keyed on auth identity ------------------------------
  useEffect(() => {
    if (!authResolved) return;
    let alive = true;
    (async () => {
      await Promise.all([
        loadProfiles(), loadCafes(), loadPosts(), loadFollows(), loadSuggestions(),
        meId ? loadMySaves(meId) : Promise.resolve(setMySaves([])),
        meId ? loadMyLists(meId) : Promise.resolve(setMyLists([])),
      ]);
      if (alive) { setReady(true); everReady.current = true; }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authResolved, meId]);

  // --- derived / computed -------------------------------------------------
  const me = useMemo(() => (meId ? profiles.find((p) => p.id === meId) ?? null : null), [meId, profiles]);

  const postsOut = useMemo<Post[]>(() => {
    const cafeById = new Map(cafes.map((c) => [c.id, c] as const));
    const likeCountMap = new Map<string, number>();
    likeRows.forEach((l) => likeCountMap.set(l.postId, (likeCountMap.get(l.postId) ?? 0) + 1));
    const commentCountMap = new Map<string, number>();
    comments.forEach((c) => commentCountMap.set(c.postId, (commentCountMap.get(c.postId) ?? 0) + 1));
    return posts.map((p) => ({
      ...p,
      cafeName: p.cafeId ? cafeById.get(p.cafeId)?.name : undefined,
      likeCount: likeCountMap.get(p.id) ?? 0,
      commentCount: commentCountMap.get(p.id) ?? 0,
      likedByMe: !!meId && likeRows.some((l) => l.postId === p.id && l.userId === meId),
    }));
  }, [posts, cafes, likeRows, comments, meId]);

  const suggestionsOut = useMemo<SuggestedCafe[]>(
    () => suggestions.map((s) => ({ ...s, submitterName: profiles.find((p) => p.id === s.submittedBy)?.name })),
    [suggestions, profiles],
  );

  const getUser = useCallback((id: string) => profiles.find((p) => p.id === id) ?? { ...FALLBACK_USER, id }, [profiles]);
  const getCafe = useCallback((id: string) => cafes.find((c) => c.id === id), [cafes]);

  const isLiked = useCallback((postId: string) => !!meId && likeRows.some((l) => l.postId === postId && l.userId === meId), [likeRows, meId]);
  const likeCount = useCallback((postId: string) => likeRows.filter((l) => l.postId === postId).length, [likeRows]);
  const commentsFor = useCallback(
    (postId: string) => comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [comments],
  );
  const isFollowing = useCallback(
    (userId: string) => !!meId && follows.some((f) => f.followerId === meId && f.followingId === userId),
    [follows, meId],
  );
  const savesForCafe = useCallback((cafeId: string) => mySaves.filter((v) => v.cafeId === cafeId), [mySaves]);
  const hasSave = useCallback((cafeId: string, type: SaveType) => savesForCafe(cafeId).some((v) => v.saveType === type), [savesForCafe]);
  const savesByType = useCallback((type: SaveType) => mySaves.filter((v) => v.saveType === type), [mySaves]);
  const listsForMe = useCallback(() => myLists, [myLists]);
  const myPosts = useCallback(() => postsOut.filter((p) => p.userId === meId), [postsOut, meId]);
  const mySuggestions = useCallback(() => suggestionsOut.filter((x) => x.submittedBy === meId), [suggestionsOut, meId]);

  const feedPosts = useCallback((mode: string) => {
    let list = [...postsOut];
    if (mode === 'Following' && meId) {
      const ids = new Set(follows.filter((f) => f.followerId === meId).map((f) => f.followingId));
      list = list.filter((p) => ids.has(p.userId) || p.userId === meId);
    }
    if (mode === 'Trending') {
      list.sort((a, b) => (b.likeCount + b.commentCount * 2) - (a.likeCount + a.commentCount * 2));
      return list;
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [postsOut, follows, meId]);

  const postsForCafe = useCallback(
    (cafeId: string) => postsOut.filter((p) => p.cafeId === cafeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [postsOut],
  );

  // --- auth mutations ------------------------------------------------------
  const signIn = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, [supabase]);

  const signUp = useCallback(async (i: { name: string; username: string; email: string; password: string; location?: string }): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email: i.email, password: i.password,
      options: { data: { name: i.name, username: i.username, location: i.location ?? '' } },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.session) return { ok: false, error: 'Check your email to confirm your account, then log in.' };
    return { ok: true };
  }, [supabase]);

  const signOut = useCallback(() => { supabase.auth.signOut(); }, [supabase]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    if (!meId) return;
    const dbPatch: Record<string, any> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.username !== undefined) dbPatch.username = patch.username;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.profilePhotoUrl !== undefined) dbPatch.profile_photo_url = patch.profilePhotoUrl;
    setProfiles((prev) => prev.map((p) => (p.id === meId ? { ...p, ...patch } : p)));
    supabase.from('profiles').update(dbPatch).eq('id', meId).then(({ error }: any) => {
      if (error) { console.error(error); loadProfiles(); }
    });
  }, [meId, supabase, loadProfiles]);

  // --- social mutations ------------------------------------------------------
  const toggleLike = useCallback((postId: string) => {
    if (!meId) return;
    const existing = likeRows.find((l) => l.postId === postId && l.userId === meId);
    if (existing) {
      setLikeRows((prev) => prev.filter((l) => !(l.postId === postId && l.userId === meId)));
      supabase.from('likes').delete().eq('post_id', postId).eq('user_id', meId).then(({ error }: any) => {
        if (error) { console.error(error); setLikeRows((prev) => [...prev, existing]); }
      });
    } else {
      setLikeRows((prev) => [...prev, { postId, userId: meId }]);
      supabase.from('likes').insert({ post_id: postId, user_id: meId }).then(({ error }: any) => {
        if (error) { console.error(error); setLikeRows((prev) => prev.filter((l) => !(l.postId === postId && l.userId === meId))); }
      });
    }
  }, [meId, likeRows, supabase]);

  const addComment = useCallback((postId: string, content: string) => {
    if (!meId || !content.trim()) return;
    const tempId = 'tmp-' + uid();
    const optimistic: Comment = { id: tempId, postId, userId: meId, content: content.trim(), createdAt: new Date().toISOString() };
    setComments((prev) => [...prev, optimistic]);
    supabase.from('comments').insert({ post_id: postId, user_id: meId, content: content.trim() }).select().single().then(({ data, error }: any) => {
      if (error) { console.error(error); setComments((prev) => prev.filter((c) => c.id !== tempId)); }
      else if (data) setComments((prev) => prev.map((c) => (c.id === tempId ? rowToComment(data) : c)));
    });
  }, [meId, supabase]);

  const toggleFollow = useCallback((userId: string) => {
    if (!meId || userId === meId) return;
    const exists = follows.some((f) => f.followerId === meId && f.followingId === userId);
    if (exists) {
      setFollows((prev) => prev.filter((f) => !(f.followerId === meId && f.followingId === userId)));
      supabase.from('follows').delete().eq('follower_id', meId).eq('following_id', userId).then(({ error }: any) => {
        if (error) { console.error(error); loadFollows(); }
      });
    } else {
      setFollows((prev) => [...prev, { followerId: meId, followingId: userId }]);
      supabase.from('follows').insert({ follower_id: meId, following_id: userId }).then(({ error }: any) => {
        if (error) { console.error(error); loadFollows(); }
      });
    }
  }, [meId, follows, supabase, loadFollows]);

  const createPost = useCallback((i: { caption: string; cafeId: string | null; drinkTag: string | null; visibility: Visibility; photos: string[] }) => {
    if (!meId) return;
    (async () => {
      const { data: postRow, error } = await supabase.from('posts').insert({
        user_id: meId, cafe_id: i.cafeId, caption: i.caption, drink_tag: i.drinkTag, visibility: i.visibility,
      }).select().single();
      if (error || !postRow) { console.error(error); return; }
      if (i.photos.length > 0) {
        await supabase.from('post_photos').insert(i.photos.map((url, idx) => ({ post_id: postRow.id, image_url: url, position: idx })));
      }
      setPosts((prev) => [rowToPost(postRow, i.photos), ...prev]);
    })();
  }, [meId, supabase]);

  const toggleSave = useCallback((cafeId: string, type: SaveType) => {
    if (!meId) return;
    const existing = mySaves.find((s) => s.cafeId === cafeId && s.saveType === type);
    if (existing) {
      setMySaves((prev) => prev.filter((s) => s.id !== existing.id));
      supabase.from('user_cafe_saves').delete().eq('id', existing.id).then(({ error }: any) => {
        if (error) { console.error(error); setMySaves((prev) => [...prev, existing]); }
      });
    } else {
      const tempId = 'tmp-' + uid();
      setMySaves((prev) => [...prev, { id: tempId, userId: meId, cafeId, saveType: type, createdAt: new Date().toISOString() }]);
      supabase.from('user_cafe_saves').insert({ user_id: meId, cafe_id: cafeId, save_type: type }).select().single().then(({ data, error }: any) => {
        if (error) { console.error(error); setMySaves((prev) => prev.filter((s) => s.id !== tempId)); }
        else if (data) setMySaves((prev) => prev.map((s) => (s.id === tempId ? rowToSave(data) : s)));
      });
    }
  }, [meId, mySaves, supabase]);

  const sipCafe = useCallback((cafeId: string, d: { note?: string; orderedDrink?: string; milkType?: string; recommend?: boolean | null }) => {
    if (!meId) return;
    const wantToGo = mySaves.find((s) => s.cafeId === cafeId && s.saveType === 'want_to_go');
    const others = mySaves.filter((s) => !(s.cafeId === cafeId && (s.saveType === 'sipped_there' || s.saveType === 'want_to_go')));
    const tempId = 'tmp-' + uid();
    setMySaves([...others, {
      id: tempId, userId: meId, cafeId, saveType: 'sipped_there', createdAt: new Date().toISOString(),
      note: d.note || null, orderedDrink: d.orderedDrink || null, milkType: d.milkType || null, recommend: d.recommend ?? null,
    }]);
    (async () => {
      if (wantToGo) await supabase.from('user_cafe_saves').delete().eq('id', wantToGo.id);
      const { data, error } = await supabase.from('user_cafe_saves').upsert({
        user_id: meId, cafe_id: cafeId, save_type: 'sipped_there',
        note: d.note || null, ordered_drink: d.orderedDrink || null, milk_type: d.milkType || null, recommend: d.recommend ?? null,
      }, { onConflict: 'user_id,cafe_id,save_type' }).select().single();
      if (error) { console.error(error); loadMySaves(meId); }
      else if (data) setMySaves((prev) => prev.map((s) => (s.id === tempId ? rowToSave(data) : s)));
    })();
  }, [meId, mySaves, supabase, loadMySaves]);

  const createList = useCallback((name: string, description?: string) => {
    const tempId = 'tmp-' + uid();
    if (!meId) return tempId;
    setMyLists((prev) => [...prev, { id: tempId, userId: meId, name, description: description || '', createdAt: new Date().toISOString(), cafeIds: [] }]);
    supabase.from('custom_lists').insert({ user_id: meId, name, description: description || '' }).select().single().then(({ data, error }: any) => {
      if (error) { console.error(error); setMyLists((prev) => prev.filter((l) => l.id !== tempId)); }
      else if (data) setMyLists((prev) => prev.map((l) => (l.id === tempId ? { id: data.id, userId: data.user_id, name: data.name, description: data.description ?? '', createdAt: data.created_at, cafeIds: [] } : l)));
    });
    return tempId;
  }, [meId, supabase]);

  const addToList = useCallback((listId: string, cafeId: string) => {
    setMyLists((prev) => prev.map((l) => (l.id === listId && !l.cafeIds?.includes(cafeId) ? { ...l, cafeIds: [...(l.cafeIds || []), cafeId] } : l)));
    supabase.from('custom_list_items').insert({ list_id: listId, cafe_id: cafeId }).then(({ error }: any) => {
      if (error) { console.error(error); loadMyLists(meId!); }
    });
  }, [supabase, loadMyLists, meId]);

  const removeFromList = useCallback((listId: string, cafeId: string) => {
    setMyLists((prev) => prev.map((l) => (l.id === listId ? { ...l, cafeIds: (l.cafeIds || []).filter((x) => x !== cafeId) } : l)));
    supabase.from('custom_list_items').delete().eq('list_id', listId).eq('cafe_id', cafeId).then(({ error }: any) => {
      if (error) { console.error(error); loadMyLists(meId!); }
    });
  }, [supabase, loadMyLists, meId]);

  const suggestCafe = useCallback((i: Omit<SuggestedCafe, 'id' | 'submittedBy' | 'moderationStatus' | 'createdAt' | 'submitterName'>) => {
    if (!meId) return;
    const tempId = 'tmp-' + uid();
    setSuggestions((prev) => [{ ...i, id: tempId, submittedBy: meId, moderationStatus: 'pending', createdAt: new Date().toISOString() }, ...prev]);
    supabase.from('suggested_cafes').insert({
      submitted_by: meId, name: i.name, address: i.address, city: i.city, state: i.state, country: i.country,
      description: i.description, website: i.website ?? null, instagram: i.instagram ?? null,
      photo_url: i.photoUrl ?? null, tags: i.tags ?? [],
    }).select().single().then(({ data, error }: any) => {
      if (error) { console.error(error); setSuggestions((prev) => prev.filter((s) => s.id !== tempId)); }
      else if (data) setSuggestions((prev) => prev.map((s) => (s.id === tempId ? rowToSuggestion(data) : s)));
    });
  }, [meId, supabase]);

  const approveSuggestion = useCallback((id: string, coords: { lat: number; lng: number }) => {
    (async () => {
      const sug = suggestions.find((s) => s.id === id);
      if (!sug) return;
      const { data: newCafe, error: e1 } = await supabase.from('cafes').insert({
        name: sug.name, address: sug.address, city: sug.city, state: sug.state, country: sug.country,
        description: sug.description, website: sug.website ?? null, instagram: sug.instagram ?? null,
        cover_photo_url: sug.photoUrl ?? '', status: 'approved',
        latitude: coords.lat, longitude: coords.lng,
      }).select().single();
      if (e1) { console.error(e1); return; }
      if (sug.tags && sug.tags.length > 0 && newCafe) {
        await supabase.from('cafe_tags').insert(sug.tags.map((tag) => ({ cafe_id: newCafe.id, category: 'Suggested', tag })));
      }
      const { error: e2 } = await supabase.from('suggested_cafes').update({ moderation_status: 'approved' }).eq('id', id);
      if (e2) console.error(e2);
      await Promise.all([loadCafes(), loadSuggestions()]);
    })();
  }, [suggestions, supabase, loadCafes, loadSuggestions]);

  const rejectSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, moderationStatus: 'rejected' } : s)));
    supabase.from('suggested_cafes').update({ moderation_status: 'rejected' }).eq('id', id).then(({ error }: any) => {
      if (error) { console.error(error); loadSuggestions(); }
    });
  }, [supabase, loadSuggestions]);

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    supabase.from('posts').delete().eq('id', id).then(({ error }: any) => {
      if (error) { console.error(error); loadPosts(); }
    });
  }, [supabase, loadPosts]);

  const value: StoreValue = {
    ready, me, isAuthed: !!me, users: profiles, cafes,
    posts: postsOut, comments, saves: mySaves, lists: myLists,
    suggestions: suggestionsOut, follows,
    getUser, getCafe, isLiked, likeCount, commentsFor, isFollowing,
    savesForCafe, hasSave, savesByType, listsForMe, myPosts, mySuggestions,
    feedPosts, postsForCafe,
    signIn, signUp, signOut, updateProfile,
    toggleLike, addComment, toggleFollow, createPost,
    toggleSave, sipCafe, createList, addToList, removeFromList, suggestCafe,
    approveSuggestion, rejectSuggestion, deletePost,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
