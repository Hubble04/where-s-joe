'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { AppNotification, NotificationType } from '@/lib/types';
import { EmptyState, SignInPrompt } from '@/components/ui';
import { Button } from '@/components/Button';
import { timeAgo } from '@/lib/utils';

const ICONS: Record<NotificationType, string> = {
  like: 'M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.2 2 5.5 4.1 3.5 6.8 3.5c1.5 0 3 .7 3.9 1.9.9-1.2 2.4-1.9 3.9-1.9 2.7 0 4.8 2 4.8 4.7 0 3.7-3.4 6.8-8.5 11.4z',
  comment: 'M4 8h13a3 3 0 0 1 0 6h-1M4 8v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3',
  follow: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  suggestion_approved: 'M20 6L9 17l-5-5',
  suggestion_rejected: 'M18 6L6 18M6 6l12 12',
  edit_resolved: 'M20 6L9 17l-5-5',
  claim_approved: 'M20 6L9 17l-5-5',
  claim_rejected: 'M18 6L6 18M6 6l12 12',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { me, notifications, markNotificationRead, markAllNotificationsRead } = useStore();

  if (!me) {
    return (
      <div className="px-4 py-4">
        <p className="eyebrow mb-1">Activity</p>
        <h1 className="mb-4 font-display text-3xl text-racing-700">Notifications</h1>
        <SignInPrompt message="Log in to see activity on your posts and account." />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function openNotification(n: AppNotification) {
    if (!n.read) markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Activity</p>
          <h1 className="font-display text-3xl text-racing-700">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>Mark all read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Nothing yet" body="Likes, comments, follows, and updates on your submissions will show up here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              className={`flex w-full items-start gap-3 rounded-card px-3 py-3 text-left shadow-card transition-colors ${n.read ? 'bg-ivory' : 'bg-amber/5'}`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-racing-700" strokeWidth={1.8}>
                  <path d={ICONS[n.type]} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-coffee/85">{n.message}</span>
                <span className="mt-0.5 block font-mono text-[0.65rem] text-coffee/45">{timeAgo(n.createdAt)}</span>
              </span>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber" />}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-center font-mono text-[0.65rem] text-coffee/40">
        Manage what you get notified about in{' '}
        <Link href="/profile" className="text-racing-600 underline">Profile → Settings</Link>.
      </p>
    </div>
  );
}
