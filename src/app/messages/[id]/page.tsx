'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/Button';
import { SignInPrompt } from '@/components/ui';
import { BlockUserModal, ReportUserModal } from '@/components/MessagingModals';

export default function ThreadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const {
    me, ready, conversations, getUser, messagesFor, isBlocked, unblockUser,
    respondToMessageRequest, sendMessage, markConversationRead, refreshMessages,
  } = useStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === id);
  const messages = conv ? messagesFor(conv.id) : [];
  const lastRead = conv && me ? (conv.requesterId === me.id ? conv.requesterLastReadAt : conv.recipientLastReadAt) : '';
  const hasUnread = !!me && !!conv && conv.status === 'accepted'
    && messages.some((m) => m.senderId !== me.id && m.createdAt > lastRead);

  useEffect(() => { if (me) refreshMessages(); }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasUnread && conv) markConversationRead(conv.id); }, [hasUnread, conv?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length, conv?.status]);

  if (!me) {
    return (
      <div className="px-4 py-4">
        <h1 className="mb-4 font-display text-3xl text-racing-700">Messages</h1>
        <SignInPrompt message="Log in to read your messages." />
      </div>
    );
  }
  if (!conv) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl text-racing-700">{ready ? 'Conversation not found' : 'Loading…'}</p>
        {ready && <Link href="/messages" className="mt-3 inline-block font-mono text-sm text-racing-600 underline">Back to Messages</Link>}
      </div>
    );
  }

  const otherId = conv.requesterId === me.id ? conv.recipientId : conv.requesterId;
  const other = getUser(otherId);
  const iAmRecipient = conv.recipientId === me.id;
  const iBlocked = isBlocked(otherId);

  async function submit() {
    if (!conv || !text.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(conv.id, text);
    setSending(false);
    if (ok) setText('');
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <div className="relative flex items-center gap-3 border-b border-racing-100 px-4 py-3">
        <Link href="/messages" aria-label="Back to messages" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-racing-700" strokeWidth={1.8}><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <Link href={`/user/${other.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <ImageWithFallback src={other.profilePhotoUrl} alt={other.name} seed={other.name} className="h-9 w-9 shrink-0 rounded-full" />
          <span className="min-w-0">
            <span className="block truncate font-heading text-base leading-tight text-racing-700">{other.name}</span>
            <span className="block truncate font-mono text-[0.65rem] text-coffee/55">@{other.username}</span>
          </span>
        </Link>
        <button onClick={() => refreshMessages()} aria-label="Refresh" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-coffee/60 hover:bg-parchment">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="More" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-coffee/60 hover:bg-parchment">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-14 z-20 w-40 overflow-hidden rounded-card border border-racing-100 bg-ivory shadow-lift">
            <button onClick={() => { setMenuOpen(false); setReporting(true); }} className="block w-full px-4 py-2.5 text-left font-mono text-xs text-coffee/80 hover:bg-parchment">Report</button>
            {iBlocked ? (
              <button onClick={() => { setMenuOpen(false); unblockUser(otherId); }} className="block w-full px-4 py-2.5 text-left font-mono text-xs text-coffee/80 hover:bg-parchment">Unblock</button>
            ) : (
              <button onClick={() => { setMenuOpen(false); setBlocking(true); }} className="block w-full px-4 py-2.5 text-left font-mono text-xs text-red-700 hover:bg-parchment">Block</button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div className={cn(
                'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                mine ? 'rounded-br-md bg-racing-600 text-ivory' : 'rounded-bl-md bg-parchment text-coffee/90',
              )}>
                {m.body}
              </div>
              <span className="mt-0.5 px-1 font-mono text-[0.6rem] text-coffee/40">{timeAgo(m.createdAt)}</span>
            </div>
          );
        })}

        {conv.status === 'pending' && iAmRecipient && (
          <div className="mt-4 rounded-card bg-amber/5 p-4 text-center">
            <p className="text-sm text-coffee/80">
              <span className="text-racing-700">@{other.username}</span> wants to message you. Accept to start chatting.
            </p>
            <p className="mt-1 font-mono text-[0.65rem] text-coffee/45">If you decline, they won&rsquo;t be told.</p>
            <div className="mt-3 flex gap-2">
              <Button className="flex-1" onClick={() => respondToMessageRequest(conv.id, true)}>Accept</Button>
              <Button variant="outline" className="flex-1" onClick={() => respondToMessageRequest(conv.id, false)}>Decline</Button>
            </div>
          </div>
        )}
        {conv.status === 'pending' && !iAmRecipient && (
          <p className="mt-4 rounded-card bg-parchment px-4 py-3 text-center font-mono text-xs text-coffee/60">
            Request sent. You can chat once @{other.username} accepts.
          </p>
        )}
        {conv.status === 'declined' && (
          <p className="mt-4 rounded-card bg-parchment px-4 py-3 text-center font-mono text-xs text-coffee/60">
            {iAmRecipient ? 'You declined this request.' : `Request sent. You can chat once @${other.username} accepts.`}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {conv.status === 'accepted' && (
        iBlocked ? (
          <div className="border-t border-racing-100 px-4 py-3 text-center">
            <p className="mb-2 font-mono text-xs text-coffee/55">You blocked @{other.username}.</p>
            <Button variant="outline" size="sm" onClick={() => unblockUser(otherId)}>Unblock</Button>
          </div>
        ) : (
          <div className="flex items-end gap-2 border-t border-racing-100 px-4 py-3">
            <textarea
              value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Message…"
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-racing-100 bg-ivory px-3.5 py-2 font-mono text-sm placeholder:text-coffee/40 focus:outline-none focus:ring-2 focus:ring-racing-600"
            />
            <Button onClick={submit} disabled={!text.trim() || sending}>Send</Button>
          </div>
        )
      )}

      {blocking && <BlockUserModal user={other} onClose={() => setBlocking(false)} />}
      {reporting && <ReportUserModal user={other} conversationId={conv.id} onClose={() => setReporting(false)} />}
    </div>
  );
}
