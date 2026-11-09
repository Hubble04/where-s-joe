'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { REPORT_REASONS, POST_REPORT_REASONS, CAFE_REPORT_REASONS, PROFILE_REPORT_REASONS, type Profile, type ReportReason } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Modal } from './ui';
import { Button } from './Button';

export function BlockUserModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const { blockUser } = useStore();
  return (
    <Modal open onClose={onClose} title={`Block @${user.username}?`}>
      <p className="mb-5 text-sm text-coffee/75">
        You won&rsquo;t see their posts or comments, and they won&rsquo;t be able to message you. They won&rsquo;t be told you blocked them, and you can unblock them any time from Profile → Settings.
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="danger" className="flex-1" onClick={() => { blockUser(user.id); onClose(); }}>Block</Button>
      </div>
    </Modal>
  );
}

export function ReportUserModal({ user, conversationId, onClose }: { user: Profile; conversationId?: string; onClose: () => void }) {
  const { reportUser } = useStore();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!reason || busy) return;
    setBusy(true);
    const ok = await reportUser(user.id, reason, details.trim(), conversationId);
    setBusy(false);
    if (ok) setSent(true);
  }

  return (
    <Modal open onClose={onClose} title={`Report @${user.username}`}>
      {sent ? (
        <div className="py-4 text-center">
          <p className="font-heading text-base text-racing-700">Thanks for letting us know.</p>
          <p className="mt-1 font-mono text-xs text-coffee/60">Joe&rsquo;s team will take a look.</p>
          <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-coffee/70">What&rsquo;s the problem?</p>
          <div className="mb-4 flex flex-col gap-1.5">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left font-mono text-xs transition-colors',
                  reason === r ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 text-coffee/70 hover:border-racing-300',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="mb-1 block font-mono text-xs text-coffee/60">Details (optional)</label>
          <textarea
            value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={500}
            placeholder="Anything else that would help us understand?"
            className="mb-2 w-full resize-none rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600"
          />
          {conversationId && (
            <p className="mb-4 font-mono text-[0.65rem] text-coffee/45">
              Their recent messages in this chat will be included so Joe&rsquo;s team can review them.
            </p>
          )}
          <Button className="w-full" disabled={!reason || busy} onClick={submit}>{busy ? 'Sending…' : 'Submit report'}</Button>
        </>
      )}
    </Modal>
  );
}

/** One-tap "pick a reason" report dialog shared by posts, cafés and profiles. */
function ReasonReportModal<R extends string>({ title, reasons, onSubmit, onClose }: {
  title: string; reasons: readonly R[]; onSubmit: (reason: R) => Promise<boolean>; onClose: () => void;
}) {
  const [reason, setReason] = useState<R | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!reason || busy) return;
    setBusy(true);
    const ok = await onSubmit(reason);
    setBusy(false);
    if (ok) setSent(true);
  }

  return (
    <Modal open onClose={onClose} title={title}>
      {sent ? (
        <div className="py-4 text-center">
          <p className="font-heading text-base text-racing-700">Thanks for letting us know.</p>
          <p className="mt-1 font-mono text-xs text-coffee/60">Joe&rsquo;s team will take a look.</p>
          <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-coffee/70">What&rsquo;s wrong with it?</p>
          <div className="mb-4 flex flex-col gap-1.5">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left font-mono text-xs transition-colors',
                  reason === r ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 text-coffee/70 hover:border-racing-300',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!reason || busy} onClick={submit}>{busy ? 'Sending…' : 'Submit report'}</Button>
        </>
      )}
    </Modal>
  );
}

export function ReportPostModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { reportPost } = useStore();
  return <ReasonReportModal title="Report this post" reasons={POST_REPORT_REASONS} onSubmit={(r) => reportPost(postId, r)} onClose={onClose} />;
}

export function ReportCafeModal({ cafeId, onClose }: { cafeId: string; onClose: () => void }) {
  const { reportCafe } = useStore();
  return <ReasonReportModal title="Report this café" reasons={CAFE_REPORT_REASONS} onSubmit={(r) => reportCafe(cafeId, r)} onClose={onClose} />;
}

export function ReportProfileModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const { reportProfile } = useStore();
  return <ReasonReportModal title={`Report @${user.username}`} reasons={PROFILE_REPORT_REASONS} onSubmit={(r) => reportProfile(user.id, r)} onClose={onClose} />;
}
