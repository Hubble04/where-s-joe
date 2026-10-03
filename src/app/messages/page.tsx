'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import type { Conversation } from '@/lib/types';
import { EmptyState, SignInPrompt } from '@/components/ui';
import { Button } from '@/components/Button';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { timeAgo } from '@/lib/utils';

export default function MessagesPage() {
  const { me, conversations, refreshMessages } = useStore();

  useEffect(() => { if (me) refreshMessages(); }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!me) {
    return (
      <div className="px-4 py-4">
        <p className="eyebrow mb-1">Direct</p>
        <h1 className="mb-4 font-display text-3xl text-racing-700">Messages</h1>
        <SignInPrompt message="Log in to message other coffee people." />
      </div>
    );
  }

  const byRecent = (a: Conversation, b: Conversation) => b.updatedAt.localeCompare(a.updatedAt);
  const incoming = conversations.filter((c) => c.status === 'pending' && c.recipientId === me.id).sort(byRecent);
  const chats = conversations.filter((c) => c.status === 'accepted').sort(byRecent);
  const sent = conversations.filter((c) => c.requesterId === me.id && c.status !== 'accepted').sort(byRecent);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Direct</p>
          <h1 className="font-display text-3xl text-racing-700">Messages</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refreshMessages()}>Refresh</Button>
      </div>

      {incoming.length === 0 && chats.length === 0 && sent.length === 0 && (
        <EmptyState title="No messages yet" body="Tap a username on a post to say hello. They'll get a request and can accept to start chatting." />
      )}

      {incoming.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Requests ({incoming.length})</p>
          <div className="space-y-2">
            {incoming.map((c) => <RequestRow key={c.id} conv={c} />)}
          </div>
        </section>
      )}

      {chats.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Chats</p>
          <div className="space-y-2">
            {chats.map((c) => <ChatRow key={c.id} conv={c} />)}
          </div>
        </section>
      )}

      {sent.length > 0 && (
        <section>
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Sent requests</p>
          <div className="space-y-2">
            {sent.map((c) => <SentRow key={c.id} conv={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function RequestRow({ conv }: { conv: Conversation }) {
  const { getUser, messagesFor, respondToMessageRequest } = useStore();
  const user = getUser(conv.requesterId);
  const first = messagesFor(conv.id)[0];
  return (
    <div className="rounded-card bg-amber/5 p-3 shadow-card">
      <Link href={`/messages/${conv.id}`} className="flex items-start gap-3">
        <ImageWithFallback src={user.profilePhotoUrl} alt={user.name} seed={user.name} className="h-10 w-10 shrink-0 rounded-full" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-mono text-sm text-racing-700">@{user.username}</span>
            <span className="shrink-0 font-mono text-[0.65rem] text-coffee/40">{timeAgo(conv.createdAt)}</span>
          </span>
          {first && <span className="mt-0.5 line-clamp-2 block text-sm text-coffee/80">{first.body}</span>}
        </span>
      </Link>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => respondToMessageRequest(conv.id, true)}>Accept</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => respondToMessageRequest(conv.id, false)}>Decline</Button>
      </div>
    </div>
  );
}

function ChatRow({ conv }: { conv: Conversation }) {
  const { me, getUser, messagesFor, isBlocked } = useStore();
  if (!me) return null;
  const otherId = conv.requesterId === me.id ? conv.recipientId : conv.requesterId;
  const user = getUser(otherId);
  const msgs = messagesFor(conv.id);
  const last = msgs[msgs.length - 1];
  const lastRead = conv.requesterId === me.id ? conv.requesterLastReadAt : conv.recipientLastReadAt;
  const unread = msgs.some((m) => m.senderId !== me.id && m.createdAt > lastRead);
  return (
    <Link href={`/messages/${conv.id}`} className={`flex items-center gap-3 rounded-card px-3 py-3 shadow-card ${unread ? 'bg-amber/5' : 'bg-ivory'}`}>
      <ImageWithFallback src={user.profilePhotoUrl} alt={user.name} seed={user.name} className="h-10 w-10 shrink-0 rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-mono text-sm text-racing-700">@{user.username}</span>
          {last && <span className="shrink-0 font-mono text-[0.65rem] text-coffee/40">{timeAgo(last.createdAt)}</span>}
        </span>
        <span className={`mt-0.5 block truncate text-sm ${unread ? 'text-coffee' : 'text-coffee/60'}`}>
          {isBlocked(otherId) ? 'Blocked' : last ? `${last.senderId === me.id ? 'You: ' : ''}${last.body}` : 'No messages yet'}
        </span>
      </span>
      {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-amber" />}
    </Link>
  );
}

function SentRow({ conv }: { conv: Conversation }) {
  const { getUser } = useStore();
  const user = getUser(conv.recipientId);
  return (
    <Link href={`/messages/${conv.id}`} className="flex items-center gap-3 rounded-card bg-ivory px-3 py-3 opacity-80 shadow-card">
      <ImageWithFallback src={user.profilePhotoUrl} alt={user.name} seed={user.name} className="h-9 w-9 shrink-0 rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-racing-700">@{user.username}</span>
        <span className="block font-mono text-[0.65rem] text-coffee/50">Request sent · {timeAgo(conv.createdAt)}</span>
      </span>
    </Link>
  );
}
