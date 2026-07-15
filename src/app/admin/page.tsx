'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { SectionTitle, EmptyState, Chip } from '@/components/ui';
import { Button } from '@/components/Button';
import { timeAgo } from '@/lib/utils';

const TABS = ['Suggestions', 'Posts', 'Cafés', 'Users'] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const { me, suggestions, approveSuggestion, rejectSuggestion, posts, deletePost, cafes, users, getUser } = useStore();
  const [tab, setTab] = useState<Tab>('Suggestions');

  if (!me || me.role !== 'admin') {
    return (
      <div className="px-4 py-10">
        <div className="rounded-card border border-amber/30 bg-amber/5 p-5 text-center">
          <h1 className="font-display text-2xl text-racing-700">Admin only</h1>
          <p className="mt-2 text-sm text-coffee/70">
            This dashboard is limited to admins. In the demo, sign in with the email <span className="font-mono text-racing-700">joe@wheresjoe.app</span> to enter as Joe (the seeded admin).
          </p>
          <p className="mt-2 font-mono text-[0.7rem] text-coffee/50">
            With Supabase connected, set a profile&rsquo;s role to <span className="text-racing-700">admin</span> in the database to grant access.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/login"><Button>Log in as admin</Button></Link>
            <Link href="/"><Button variant="ghost">Back to Explore</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const pending = suggestions.filter((s) => s.moderationStatus === 'pending');

  return (
    <div className="px-4 py-4">
      <p className="eyebrow mb-1">Moderation</p>
      <h1 className="mb-4 font-display text-3xl text-racing-700">Admin</h1>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <Stat label="Pending" value={pending.length} />
        <Stat label="Posts" value={posts.length} />
        <Stat label="Cafés" value={cafes.length} />
        <Stat label="Users" value={users.length} />
      </div>

      <div className="rail mb-4">
        {TABS.map((t) => <Chip key={t} label={t === 'Suggestions' ? `Suggestions${pending.length ? ` (${pending.length})` : ''}` : t} active={tab === t} onClick={() => setTab(t)} />)}
      </div>

      {tab === 'Suggestions' && (
        pending.length === 0 ? <EmptyState title="Queue is clear" body="No café suggestions awaiting review." /> : (
          <div className="space-y-3">
            {pending.map((s) => (
              <div key={s.id} className="rounded-card bg-ivory p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-racing-700">{s.name}</h3>
                    <p className="font-mono text-xs text-coffee/55">{s.address ? s.address + ' · ' : ''}{s.city}{s.state ? `, ${s.state}` : ''}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.65rem] text-coffee/40">{timeAgo(s.createdAt)}</span>
                </div>
                {s.description && <p className="mt-2 text-sm text-coffee/80">{s.description}</p>}
                {s.tags && s.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.map((t) => <span key={t} className="rounded-pill bg-parchment px-2 py-0.5 font-mono text-[0.65rem] text-coffee/70">{t}</span>)}
                  </div>
                )}
                <p className="mt-2 font-mono text-[0.65rem] text-coffee/45">Suggested by {s.submitterName || 'a member'}</p>
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1" onClick={() => approveSuggestion(s.id)}>Approve</Button>
                  <Button variant="danger" className="flex-1" onClick={() => rejectSuggestion(s.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Posts' && (
        posts.length === 0 ? <EmptyState title="No posts" /> : (
          <div className="space-y-2">
            {posts.map((p) => {
              const u = getUser(p.userId);
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-card bg-ivory p-3 shadow-card">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-coffee/85">{p.caption || '(photo only)'}</p>
                    <p className="font-mono text-[0.65rem] text-coffee/50">@{u.username} · {timeAgo(p.createdAt)}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => deletePost(p.id)}>Delete</Button>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'Cafés' && (
        <div className="space-y-2">
          {cafes.map((c) => (
            <Link key={c.id} href={`/cafe/${c.id}`} className="flex items-center justify-between gap-2 rounded-card bg-ivory p-3 shadow-card">
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-racing-700">{c.name}</p>
                <p className="font-mono text-[0.65rem] text-coffee/50">{c.neighborhood} · {c.city}, {c.state}</p>
              </div>
              {c.verifiedByJoe && <span className="shrink-0 rounded-pill bg-racing-600/15 px-2 py-0.5 font-mono text-[0.6rem] text-racing-700">Verified</span>}
            </Link>
          ))}
        </div>
      )}

      {tab === 'Users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 rounded-card bg-ivory p-3 shadow-card">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-racing-700">@{u.username}</p>
                <p className="truncate font-mono text-[0.65rem] text-coffee/50">{u.name}{u.email ? ` · ${u.email}` : ''}</p>
              </div>
              {u.role === 'admin' && <span className="shrink-0 rounded-pill bg-gold/15 px-2 py-0.5 font-mono text-[0.6rem] text-gold">Admin</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-parchment px-2 py-3 text-center">
      <div className="font-display text-xl text-racing-700">{value}</div>
      <div className="font-mono text-[0.6rem] text-coffee/55">{label}</div>
    </div>
  );
}
