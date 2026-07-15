'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { isDemoMode } from '@/lib/env';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { PostCard } from '@/components/PostCard';
import { CafeCard } from '@/components/CafeCard';
import { SectionTitle, EmptyState, Modal, SignInPrompt, Chip } from '@/components/ui';
import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';

const TABS = ['Posts', 'Saved', 'Suggested'] as const;
type Tab = typeof TABS[number];

export default function ProfilePage() {
  const router = useRouter();
  const { me, myPosts, savesByType, getCafe, mySuggestions, follows, signOut, updateProfile } = useStore();
  const [tab, setTab] = useState<Tab>('Posts');
  const [editing, setEditing] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  if (!me) {
    return (
      <div className="px-4 py-4">
        <p className="eyebrow mb-1">Your account</p>
        <h1 className="mb-4 font-display text-3xl text-racing-700">Profile</h1>
        <SignInPrompt message="Log in to see your profile, posts, saved cafés, and Coffee Passport." />
      </div>
    );
  }

  const posts = myPosts();
  const saved = [...savesByType('want_to_go'), ...savesByType('favorite')];
  const savedCafes = Array.from(new Set(saved.map((s) => s.cafeId))).map(getCafe).filter(Boolean);
  const suggestions = mySuggestions();
  const sippedCount = savesByType('sipped_there').length;
  const wtgCount = savesByType('want_to_go').length;
  const followers = follows.filter((f) => f.followingId === me.id).length;
  const following = follows.filter((f) => f.followerId === me.id).length;

  return (
    <div className="px-4 py-4">
      {/* header */}
      <div className="flex items-center gap-4">
        <ImageWithFallback src={me.profilePhotoUrl} alt={me.name} seed={me.name} className="h-20 w-20 rounded-full" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl text-racing-700">{me.name}</h1>
          <p className="font-mono text-xs text-coffee/60">@{me.username}</p>
          {me.location && <p className="mt-0.5 font-mono text-[0.7rem] text-coffee/50">{me.location}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
      </div>
      {me.bio && <p className="mt-3 text-sm text-coffee/80">{me.bio}</p>}

      {/* stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="Sipped" value={sippedCount} />
        <Stat label="Posts" value={posts.length} />
        <Stat label="Followers" value={followers} />
        <Stat label="Following" value={following} />
      </div>

      {/* Coffee Passport shortcut + Joe Points teaser */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/journey" className="flex items-center justify-between rounded-card bg-racing-600 px-4 py-3 text-ivory">
          <span>
            <span className="block font-display text-lg leading-none">Coffee Passport</span>
            <span className="font-mono text-[0.65rem] text-ivory/70">{sippedCount} stamps · {wtgCount} to go</span>
          </span>
          <span className="font-mono">→</span>
        </Link>
        <div className="flex flex-col justify-center rounded-card border border-gold/30 bg-gold/5 px-4 py-3">
          <span className="font-display text-lg leading-none text-gold">Joe Points</span>
          <span className="font-mono text-[0.65rem] text-coffee/50">Rewards coming soon</span>
        </div>
      </div>

      {/* tabs */}
      <div className="rail mt-5">
        {TABS.map((t) => <Chip key={t} label={t} active={tab === t} onClick={() => setTab(t)} />)}
      </div>

      <div className="mt-4">
        {tab === 'Posts' && (
          posts.length === 0
            ? <EmptyState title="No posts yet" body="Share your first cup from the Community tab." action={<Link href="/community"><Button>Go to Community</Button></Link>} />
            : <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} onNeedAuth={() => setAuthPrompt(true)} />)}</div>
        )}
        {tab === 'Saved' && (
          savedCafes.length === 0
            ? <EmptyState title="Nothing saved" body="Save cafés as Want To Go or Favorite to find them here." />
            : <div className="space-y-3">{savedCafes.map((c) => <CafeCard key={c!.id} cafe={c!} variant="compact" />)}</div>
        )}
        {tab === 'Suggested' && (
          suggestions.length === 0
            ? <EmptyState title="No suggestions yet" body="Suggest a café and track its review status here." action={<Link href="/suggest"><Button>Suggest a café</Button></Link>} />
            : (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-card bg-ivory p-3 shadow-card">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg text-racing-700">{s.name}</p>
                      <p className="truncate font-mono text-xs text-coffee/55">{s.city}{s.state ? `, ${s.state}` : ''}</p>
                    </div>
                    <StatusPill status={s.moderationStatus} />
                  </div>
                ))}
              </div>
            )
        )}
      </div>

      {/* settings */}
      <div className="mt-8">
        <SectionTitle eyebrow="Account" title="Settings" />
        <div className="divide-y divide-racing-100 overflow-hidden rounded-card bg-ivory shadow-card">
          <SettingRow label="Edit profile" onClick={() => setEditing(true)} />
          <SettingRow label="Notifications" hint="Coming soon" />
          <SettingRow label="Privacy" hint="Coming soon" />
          <SettingRow label="Location settings" hint="Coming soon" />
          <button onClick={() => { signOut(); router.push('/'); }} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="font-mono text-sm text-red-700">Log out</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-red-700" strokeWidth={1.6}><path d="M15 12H4m0 0l3-3m-3 3l3 3M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        {isDemoMode && <p className="mt-3 text-center font-mono text-[0.65rem] text-coffee/45">Demo mode — profile changes are saved in this browser only.</p>}
      </div>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
      <Modal open={authPrompt} onClose={() => setAuthPrompt(false)} title="Sign in"><SignInPrompt message="Log in to continue." /></Modal>
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber/15 text-amber-dark', approved: 'bg-racing-600/15 text-racing-700', rejected: 'bg-red-100 text-red-700',
  };
  return <span className={`shrink-0 rounded-pill px-2.5 py-1 font-mono text-[0.65rem] capitalize ${map[status] || 'bg-parchment text-coffee/60'}`}>{status}</span>;
}

function SettingRow({ label, hint, onClick }: { label: string; hint?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="flex w-full items-center justify-between px-4 py-3 text-left disabled:opacity-70">
      <span className="font-mono text-sm text-coffee/80">{label}</span>
      {hint ? <span className="font-mono text-[0.65rem] text-coffee/40">{hint}</span>
        : <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-coffee/40" strokeWidth={1.6}><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
}

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { me, updateProfile } = useStore();
  const [name, setName] = useState(me?.name ?? '');
  const [username, setUsername] = useState(me?.username ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [location, setLocation] = useState(me?.location ?? '');
  const [photo, setPhoto] = useState<string[]>(me?.profilePhotoUrl ? [me.profilePhotoUrl] : []);

  function save() {
    updateProfile({ name: name.trim(), username: username.trim().replace(/^@/, ''), bio, location, profilePhotoUrl: photo[0] ?? me?.profilePhotoUrl ?? '' });
    onClose();
  }

  const field = 'w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600';
  const lbl = 'mb-1 block font-mono text-xs text-coffee/60';

  return (
    <Modal open onClose={onClose} title="Edit profile">
      <div className="mb-3">
        <label className={lbl}>Profile photo</label>
        <PhotoUpload value={photo} onChange={setPhoto} multiple={false} label="Add photo" bucket="avatars" />
      </div>
      <div className="mb-3"><label className={lbl}>Name</label><input className={field} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="mb-3"><label className={lbl}>Username</label><input className={field} value={username} onChange={(e) => setUsername(e.target.value)} /></div>
      <div className="mb-3"><label className={lbl}>Bio</label><textarea rows={2} className={`${field} resize-none`} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      <div className="mb-4"><label className={lbl}>Location</label><input className={field} value={location} onChange={(e) => setLocation(e.target.value)} /></div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}
