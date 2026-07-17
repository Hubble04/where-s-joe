'use client';

import {
  useEffect, useMemo, useState, useCallback,
  type ReactNode,
} from 'react';
import type {
  Profile, Cafe, Post, Comment, CafeSave, CustomList, SuggestedCafe,
  SaveType, Visibility,
} from './types';
import {
  MOCK_CAFES, MOCK_USERS, MOCK_ME, MOCK_POSTS, MOCK_COMMENTS, MOCK_FOLLOWS,
} from './mockData';
import { hasSupabase } from './env';
import { StoreContext, type StoreValue } from './storeContext';
import { SupabaseStoreProvider } from './store.supabase';

export { useStore } from './storeContext';

const LS_KEY = 'wheres-joe:v2';
const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

/** Only the mutable, user-generated slices are persisted. */
interface Persisted {
  currentUserId: string | null;
  extraUsers: Profile[];
  posts: Post[];
  comments: Comment[];
  likes: string[]; // `${postId}:${userId}`
  follows: { followerId: string; followingId: string }[];
  saves: CafeSave[];
  lists: CustomList[];
  suggestions: SuggestedCafe[];
  removedPostIds: string[];
  cafeStatusOverrides: Record<string, Cafe['status']>;
  extraCafes: Cafe[];
  profileOverrides: Record<string, Partial<Profile>>;
}

function seedSaves(): CafeSave[] {
  const me = MOCK_ME.id;
  const mk = (cafeId: string, saveType: SaveType, extra: Partial<CafeSave> = {}): CafeSave => ({
    id: uid(), userId: me, cafeId, saveType, createdAt: nowISO(), ...extra,
  });
  return [
    mk('morning-house', 'sipped_there', { orderedDrink: 'Honey Oat Cortado', milkType: 'Oat', recommend: true, note: 'Perfect slow morning.' }),
    mk('south-congress-espresso', 'sipped_there', { orderedDrink: 'Piccolo Latte', recommend: true }),
    mk('green-room', 'want_to_go'),
    mk('juniper', 'want_to_go'),
    mk('eastside-roasters', 'favorite'),
    mk('morning-house', 'favorite'),
  ];
}

function defaultState(): Persisted {
  return {
    currentUserId: null,
    extraUsers: [],
    posts: [...MOCK_POSTS],
    comments: [...MOCK_COMMENTS],
    likes: ['p1:u-theo', 'p1:u-priya', 'p3:u-mara'],
    follows: [...MOCK_FOLLOWS],
    saves: seedSaves(),
    lists: [
      { id: 'list-crawl', userId: MOCK_ME.id, name: 'Austin Coffee Crawl', description: 'The perfect SoCo-to-East-side day.', createdAt: nowISO(), cafeIds: ['morning-house', 'south-congress-espresso', 'eastside-roasters'] },
      { id: 'list-study', userId: MOCK_ME.id, name: 'Best Study Spots', description: 'Quiet, plenty of outlets.', createdAt: nowISO(), cafeIds: ['green-room', 'juniper'] },
    ],
    suggestions: [
      { id: 'sg1', submittedBy: 'u-mara', name: 'Wildflower Coffee Co.', address: '900 W 10th St', city: 'Austin', state: 'TX', country: 'USA', description: 'New spot near downtown with a great patio.', moderationStatus: 'pending', createdAt: nowISO(), submitterName: 'Mara Ellison', tags: ['Outdoor Seating', 'Wi-Fi'] },
    ],
    removedPostIds: [],
    cafeStatusOverrides: {},
    extraCafes: [],
    profileOverrides: {},
  };
}

function load(): Persisted {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch { return defaultState(); }
}

function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Persisted>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => { setS(load()); setReady(true); }, []);
  useEffect(() => {
    if (ready && typeof window !== 'undefined') {
      try { window.localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota */ }
    }
  }, [s, ready]);

  const allUsers = useMemo(() => {
    const base = [...MOCK_USERS, ...s.extraUsers];
    return base.map((u) => ({ ...u, ...(s.profileOverrides[u.id] || {}) }));
  }, [s.extraUsers, s.profileOverrides]);

  const allCafes = useMemo(() => {
    const base = [...MOCK_CAFES, ...s.extraCafes];
    return base
      .map((c) => ({ ...c, status: s.cafeStatusOverrides[c.id] ?? c.status }))
      .filter((c) => c.status === 'approved');
  }, [s.extraCafes, s.cafeStatusOverrides]);

  const me = useMemo(
    () => (s.currentUserId ? allUsers.find((u) => u.id === s.currentUserId) ?? null : null),
    [s.currentUserId, allUsers],
  );

  const getUser = useCallback((id: string) => allUsers.find((u) => u.id === id) ?? MOCK_ME, [allUsers]);
  const getCafe = useCallback((id: string) => [...MOCK_CAFES, ...s.extraCafes].find((c) => c.id === id), [s.extraCafes]);

  const likeKey = (postId: string, userId: string) => `${postId}:${userId}`;
  const isLiked = useCallback((postId: string) => !!me && s.likes.includes(likeKey(postId, me.id)), [s.likes, me]);
  const likeCount = useCallback((postId: string) => {
    const base = MOCK_POSTS.find((p) => p.id === postId)?.likeCount ?? 0;
    const seeded = ['p1:u-theo', 'p1:u-priya', 'p3:u-mara'];
    const extra = s.likes.filter((k) => k.startsWith(postId + ':') && !seeded.includes(k)).length;
    return base + extra;
  }, [s.likes]);

  const commentsFor = useCallback(
    (postId: string) => s.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [s.comments],
  );
  const isFollowing = useCallback(
    (userId: string) => !!me && s.follows.some((f) => f.followerId === me.id && f.followingId === userId),
    [s.follows, me],
  );
  const savesForCafe = useCallback(
    (cafeId: string) => (me ? s.saves.filter((v) => v.userId === me.id && v.cafeId === cafeId) : []),
    [s.saves, me],
  );
  const hasSave = useCallback(
    (cafeId: string, type: SaveType) => savesForCafe(cafeId).some((v) => v.saveType === type),
    [savesForCafe],
  );
  const savesByType = useCallback(
    (type: SaveType) => (me ? s.saves.filter((v) => v.userId === me.id && v.saveType === type) : []),
    [s.saves, me],
  );
  const listsForMe = useCallback(
    () => (me ? s.lists.filter((l) => l.userId === me.id) : []),
    [s.lists, me],
  );
  const myPosts = useCallback(
    () => (me ? s.posts.filter((p) => p.userId === me.id && !s.removedPostIds.includes(p.id)) : []),
    [s.posts, s.removedPostIds, me],
  );
  const mySuggestions = useCallback(
    () => (me ? s.suggestions.filter((x) => x.submittedBy === me.id) : []),
    [s.suggestions, me],
  );

  const visiblePosts = useMemo(
    () => s.posts.filter((p) => !s.removedPostIds.includes(p.id)),
    [s.posts, s.removedPostIds],
  );

  const feedPosts = useCallback((mode: string) => {
    let list = [...visiblePosts];
    list = list.filter((p) => {
      if (p.visibility === 'public') return true;
      if (!me) return false;
      if (p.userId === me.id) return true;
      if (p.visibility === 'followers') return s.follows.some((f) => f.followerId === me.id && f.followingId === p.userId);
      return false;
    });
    if (mode === 'Following' && me) {
      const ids = new Set(s.follows.filter((f) => f.followerId === me.id).map((f) => f.followingId));
      list = list.filter((p) => ids.has(p.userId) || p.userId === me.id);
    }
    if (mode === 'Trending') {
      list.sort((a, b) => (likeCount(b.id) + commentsFor(b.id).length * 2) - (likeCount(a.id) + commentsFor(a.id).length * 2));
      return list;
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [visiblePosts, me, s.follows, likeCount, commentsFor]);

  const postsForCafe = useCallback(
    (cafeId: string) => visiblePosts.filter((p) => p.cafeId === cafeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [visiblePosts],
  );

  const signIn = useCallback(async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const existing = allUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    const target = existing ?? MOCK_ME;
    setS((p) => ({ ...p, currentUserId: target.id }));
    return { ok: true };
  }, [allUsers]);

  const signUp = useCallback(async (i: { name: string; username: string; email: string; location?: string }): Promise<{ ok: boolean; error?: string }> => {
    if (allUsers.some((u) => u.username.toLowerCase() === i.username.toLowerCase()))
      return { ok: false, error: 'That username is taken.' };
    setS((p) => ({
      ...p,
      currentUserId: MOCK_ME.id,
      profileOverrides: {
        ...p.profileOverrides,
        [MOCK_ME.id]: { name: i.name, username: i.username, email: i.email, location: i.location ?? '' },
      },
    }));
    return { ok: true };
  }, [allUsers]);

  const signOut = useCallback(() => setS((p) => ({ ...p, currentUserId: null })), []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    if (!me) return;
    setS((p) => ({ ...p, profileOverrides: { ...p.profileOverrides, [me.id]: { ...(p.profileOverrides[me.id] || {}), ...patch } } }));
  }, [me]);

  const toggleLike = useCallback((postId: string) => {
    if (!me) return;
    const k = likeKey(postId, me.id);
    setS((p) => ({ ...p, likes: p.likes.includes(k) ? p.likes.filter((x) => x !== k) : [...p.likes, k] }));
  }, [me]);

  const addComment = useCallback((postId: string, content: string) => {
    if (!me || !content.trim()) return;
    const c: Comment = { id: uid(), postId, userId: me.id, content: content.trim(), createdAt: nowISO() };
    setS((p) => ({ ...p, comments: [...p.comments, c] }));
  }, [me]);

  const toggleFollow = useCallback((userId: string) => {
    if (!me || userId === me.id) return;
    setS((p) => {
      const exists = p.follows.some((f) => f.followerId === me.id && f.followingId === userId);
      return { ...p, follows: exists
        ? p.follows.filter((f) => !(f.followerId === me.id && f.followingId === userId))
        : [...p.follows, { followerId: me.id, followingId: userId, createdAt: nowISO() }] };
    });
  }, [me]);

  const createPost = useCallback((i: { caption: string; cafeId: string | null; drinkTag: string | null; visibility: Visibility; photos: string[] }) => {
    if (!me) return;
    const cafe = i.cafeId ? getCafe(i.cafeId) : undefined;
    const post: Post = {
      id: uid(), userId: me.id, cafeId: i.cafeId, caption: i.caption,
      drinkTag: i.drinkTag, visibility: i.visibility, createdAt: nowISO(),
      photos: i.photos, likeCount: 0, commentCount: 0, cafeName: cafe?.name,
    };
    setS((p) => ({ ...p, posts: [post, ...p.posts] }));
  }, [me, getCafe]);

  const toggleSave = useCallback((cafeId: string, type: SaveType) => {
    if (!me) return;
    setS((p) => {
      const exists = p.saves.some((v) => v.userId === me.id && v.cafeId === cafeId && v.saveType === type);
      return { ...p, saves: exists
        ? p.saves.filter((v) => !(v.userId === me.id && v.cafeId === cafeId && v.saveType === type))
        : [...p.saves, { id: uid(), userId: me.id, cafeId, saveType: type, createdAt: nowISO() }] };
    });
  }, [me]);

  const sipCafe = useCallback((cafeId: string, d: { note?: string; orderedDrink?: string; milkType?: string; recommend?: boolean | null }) => {
    if (!me) return;
    setS((p) => {
      const others = p.saves.filter((v) => !(v.userId === me.id && v.cafeId === cafeId && v.saveType === 'sipped_there'));
      const cleaned = others.filter((v) => !(v.userId === me.id && v.cafeId === cafeId && v.saveType === 'want_to_go'));
      return { ...p, saves: [...cleaned, {
        id: uid(), userId: me.id, cafeId, saveType: 'sipped_there', createdAt: nowISO(),
        note: d.note || null, orderedDrink: d.orderedDrink || null, milkType: d.milkType || null,
        recommend: d.recommend ?? null,
      }] };
    });
  }, [me]);

  const createList = useCallback((name: string, description?: string) => {
    const id = uid();
    if (!me) return id;
    setS((p) => ({ ...p, lists: [...p.lists, { id, userId: me.id, name, description: description || '', createdAt: nowISO(), cafeIds: [] }] }));
    return id;
  }, [me]);

  const addToList = useCallback((listId: string, cafeId: string) => {
    setS((p) => ({ ...p, lists: p.lists.map((l) => l.id === listId && !l.cafeIds?.includes(cafeId) ? { ...l, cafeIds: [...(l.cafeIds || []), cafeId] } : l) }));
  }, []);
  const removeFromList = useCallback((listId: string, cafeId: string) => {
    setS((p) => ({ ...p, lists: p.lists.map((l) => l.id === listId ? { ...l, cafeIds: (l.cafeIds || []).filter((x) => x !== cafeId) } : l) }));
  }, []);

  const suggestCafe = useCallback((i: Omit<SuggestedCafe, 'id' | 'submittedBy' | 'moderationStatus' | 'createdAt' | 'submitterName'>) => {
    if (!me) return;
    const sug: SuggestedCafe = { ...i, id: uid(), submittedBy: me.id, submitterName: me.name, moderationStatus: 'pending', createdAt: nowISO() };
    setS((p) => ({ ...p, suggestions: [sug, ...p.suggestions] }));
  }, [me]);

  const approveSuggestion = useCallback((id: string, coords: { lat: number; lng: number }) => {
    setS((p) => {
      const sug = p.suggestions.find((x) => x.id === id);
      if (!sug) return p;
      const newCafe: Cafe = {
        id: 'sug-' + id, name: sug.name, address: sug.address, city: sug.city, state: sug.state,
        country: sug.country, lat: coords.lat, lng: coords.lng, description: sug.description,
        website: sug.website, instagram: sug.instagram, coverPhotoUrl: sug.photoUrl || '',
        gallery: [], verifiedByJoe: false, status: 'approved', createdAt: nowISO(),
        tags: sug.tags || [], neighborhood: sug.city, rating: 0, reviewCount: 0, priceTier: 2,
      };
      return { ...p, suggestions: p.suggestions.map((x) => x.id === id ? { ...x, moderationStatus: 'approved' } : x), extraCafes: [...p.extraCafes, newCafe] };
    });
  }, []);
  const rejectSuggestion = useCallback((id: string) => {
    setS((p) => ({ ...p, suggestions: p.suggestions.map((x) => x.id === id ? { ...x, moderationStatus: 'rejected' } : x) }));
  }, []);
  const deletePost = useCallback((id: string) => {
    setS((p) => ({ ...p, removedPostIds: [...p.removedPostIds, id] }));
  }, []);

  const value: StoreValue = {
    ready, me, isAuthed: !!me, users: allUsers, cafes: allCafes,
    posts: visiblePosts, comments: s.comments, saves: s.saves, lists: s.lists,
    suggestions: s.suggestions, follows: s.follows,
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

export function StoreProvider({ children }: { children: ReactNode }) {
  return hasSupabase
    ? <SupabaseStoreProvider>{children}</SupabaseStoreProvider>
    : <DemoStoreProvider>{children}</DemoStoreProvider>;
}
