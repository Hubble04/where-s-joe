import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Permanently deletes the signed-in person's account and their own data.
 *
 * Who is deleted comes only from the caller's access token, never from the
 * request body, so a person can only ever delete themselves. Posts, comments,
 * likes, follows, saves, lists, notes, notifications, blocks and the profile are
 * removed automatically by the database (those tables reference the login with
 * ON DELETE CASCADE); this route clears the few records that
 * would otherwise be left behind (suggestions/claims), unanswered chat requests, and their uploaded photos.
 * Accepted chats are kept for the other person and show this person as "Deleted user".
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: 'Account deletion is not configured on the server.' }, { status: 501 });
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await admin.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  const userId = userData.user.id;

  // Don't let the last admin delete themselves and leave the app with no moderator.
  const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role === 'admin') {
    const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { ok: false, error: "You're the only admin. Make someone else an admin first, then delete your account." },
        { status: 409 },
      );
    }
  }

  // These keep a row (with the author blanked out) when a login is deleted, so remove them explicitly.
  for (const table of ['suggested_cafes', 'cafe_edit_suggestions', 'cafe_tag_suggestions', 'cafe_claims']) {
    const { error } = await admin.from(table).delete().eq('submitted_by', userId);
    if (error) {
      console.error(`delete-account: clearing ${table} failed`, error);
      return NextResponse.json({ ok: false, error: 'Something went wrong deleting your data. Please try again.' }, { status: 500 });
    }
  }

  // Chats: accepted conversations stay for the other person (the database turns this person into
  // "Deleted user"). Unanswered/declined requests, and chats whose other side is already gone, have no
  // history worth keeping, so remove those (their messages go with them).
  const { data: convs, error: convError } = await admin
    .from('conversations')
    .select('id, status, requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
  if (convError) {
    console.error('delete-account: reading conversations failed', convError);
    return NextResponse.json({ ok: false, error: 'Something went wrong deleting your data. Please try again.' }, { status: 500 });
  }
  const dropIds = (convs ?? [])
    .filter((c) => c.status !== 'accepted' || c.requester_id === null || c.recipient_id === null)
    .map((c) => c.id);
  if (dropIds.length > 0) {
    const { error } = await admin.from('conversations').delete().in('id', dropIds);
    if (error) {
      console.error('delete-account: removing conversations failed', error);
      return NextResponse.json({ ok: false, error: 'Something went wrong deleting your data. Please try again.' }, { status: 500 });
    }
  }

  // Uploaded photos live under a folder named for the user. cafe-images is left alone on purpose:
  // an approved café may be using a photo that came from one of their suggestions.
  for (const bucket of ['avatars', 'post-photos']) {
    const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    if (error) { console.error(`delete-account: listing ${bucket} failed`, error); continue; }
    if (files && files.length > 0) {
      const { error: removeError } = await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      if (removeError) console.error(`delete-account: removing from ${bucket} failed`, removeError);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('delete-account: deleting the login failed', deleteError);
    return NextResponse.json({ ok: false, error: 'Something went wrong deleting your account. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
