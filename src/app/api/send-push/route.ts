import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

/**
 * Sends a Web Push notification to every device a user has subscribed on.
 * Runs with the Supabase service role key so it can read subscriptions for
 * any user, bypassing RLS — this route is never called with a client's own
 * session, only fire-and-forget from the store after a notification is
 * created (see `notify()` in store.supabase.tsx).
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject = process.env.VAPID_SUBJECT ?? '';

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ ok: false, error: 'Push is not configured on the server.' }, { status: 501 });
  }

  let userId: string, title: string, body: string | undefined, url: string | undefined;
  try {
    const json = await req.json();
    userId = json.userId;
    title = json.title;
    body = json.body;
    url = json.url;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!userId || !title) {
    return NextResponse.json({ ok: false, error: 'userId and title are required.' }, { status: 400 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body: body ?? '', url: url ?? '/' });
  let sent = 0;

  await Promise.all(subs.map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload,
      );
      sent += 1;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error('push send failed', err);
      }
    }
  }));

  return NextResponse.json({ ok: true, sent });
}
