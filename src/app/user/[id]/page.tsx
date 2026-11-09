'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/Button';
import { Modal, SignInPrompt } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { BlockUserModal, ReportProfileModal } from '@/components/MessagingModals';

export default function UserPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const toast = useToast();
  const { me, ready, users, isFollowing, toggleFollow, conversationWith, requestMessage, isBlocked, unblockUser, hasReportedProfile } = useStore();
  const [authPrompt, setAuthPrompt] = useState(false);
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isMe = !!me && me.id === id;
  useEffect(() => { if (isMe) router.replace('/profile'); }, [isMe, router]);

  const user = users.find((u) => u.id === id);

  if (isMe) return null;
  if (!user) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl text-racing-700">{ready ? 'Person not found' : 'Loading…'}</p>
        {ready && <Link href="/community" className="mt-3 inline-block font-mono text-sm text-racing-600 underline">Back to Community</Link>}
      </div>
    );
  }

  const conv = me ? conversationWith(user.id) : undefined;
  const iBlocked = isBlocked(user.id);
  const following = isFollowing(user.id);

  async function sendRequest() {
    if (!user || !note.trim() || sending) return;
    setSending(true);
    setError('');
    const res = await requestMessage(user.id, note.trim());
    setSending(false);
    if (!res.ok) { setError(res.error ?? 'Something went wrong — please try again.'); return; }
    setComposing(false);
    setNote('');
    toast('Message request sent.', 'success');
  }

  let messageButton: React.ReactNode;
  if (!me) {
    messageButton = <Button className="flex-1" onClick={() => setAuthPrompt(true)}>Message</Button>;
  } else if (!conv) {
    messageButton = <Button className="flex-1" onClick={() => setComposing(true)}>Message</Button>;
  } else if (conv.status === 'accepted') {
    messageButton = <Link href={`/messages/${conv.id}`} className="flex flex-1"><Button className="w-full">Open chat</Button></Link>;
  } else if (conv.recipientId === me.id && conv.status === 'pending') {
    messageButton = <Link href={`/messages/${conv.id}`} className="flex flex-1"><Button className="w-full">Respond to request</Button></Link>;
  } else if (conv.recipientId === me.id) {
    messageButton = <Button variant="outline" className="flex-1" disabled>You declined</Button>;
  } else {
    messageButton = <Button variant="outline" className="flex-1" disabled>Request sent</Button>;
  }

  return (
    <div className="px-4 py-4">
      <button onClick={() => router.back()} aria-label="Back" className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-parchment">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-racing-700" strokeWidth={1.8}><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      <div className="rounded-card bg-ivory px-5 py-6 text-center shadow-card">
        <ImageWithFallback src={user.profilePhotoUrl} alt={user.name} seed={user.name} className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="mt-3 font-display text-3xl leading-tight text-racing-700">{user.name}</h1>
        <p className="font-mono text-sm text-coffee/60">@{user.username}</p>
        {user.location && <p className="mt-1 font-mono text-xs text-coffee/45">{user.location}</p>}
        {user.bio && <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-coffee/80">{user.bio}</p>}

        {iBlocked ? (
          <div className="mt-5">
            <p className="mb-2 font-mono text-xs text-coffee/55">You blocked @{user.username}.</p>
            <Button variant="outline" className="w-full" onClick={() => unblockUser(user.id)}>Unblock</Button>
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            <Button
              variant={following ? 'outline' : 'secondary'}
              className="flex-1"
              onClick={() => (me ? toggleFollow(user.id) : setAuthPrompt(true))}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
            {messageButton}
          </div>
        )}
      </div>

      {me && (
        <div className="mt-4 flex justify-center gap-4 font-mono text-xs text-coffee/45">
          {!iBlocked && <button onClick={() => setBlocking(true)} className="underline decoration-dotted underline-offset-2">Block</button>}
          {hasReportedProfile(user.id)
            ? <span>Reported</span>
            : <button onClick={() => setReporting(true)} className="underline decoration-dotted underline-offset-2">Report</button>}
        </div>
      )}

      <Modal open={composing} onClose={() => { setComposing(false); setError(''); }} title={`Message @${user.username}`}>
        <p className="mb-3 text-sm text-coffee/70">
          They&rsquo;ll get your note as a message request and can accept or decline. You can chat once they accept.
        </p>
        <textarea
          value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000}
          placeholder="Say hello…"
          className={cn('mb-2 w-full resize-none rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm placeholder:text-coffee/40 focus:outline-none focus:ring-2 focus:ring-racing-600')}
        />
        {error && <p className="mb-2 font-mono text-xs text-red-700">{error}</p>}
        <Button className="w-full" disabled={!note.trim() || sending} onClick={sendRequest}>
          {sending ? 'Sending…' : 'Send request'}
        </Button>
      </Modal>

      <Modal open={authPrompt} onClose={() => setAuthPrompt(false)} title="Join Where's Joe?">
        <SignInPrompt message="Log in to follow people and send messages." />
      </Modal>

      {blocking && <BlockUserModal user={user} onClose={() => setBlocking(false)} />}
      {reporting && <ReportProfileModal user={user} onClose={() => setReporting(false)} />}
    </div>
  );
}
