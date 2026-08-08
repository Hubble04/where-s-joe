'use client';
import { useEffect, useState } from 'react';
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
import { isIOS, isStandalone, isPushSupported, subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '@/lib/push';

const TABS = ['Posts', 'Saved', 'Suggested'] as const;
type Tab = typeof TABS[number];

export default function ProfilePage() {
  const router = useRouter();
  const { me, myPosts, savesByType, getCafe, mySuggestions, follows, signOut, updateProfile } = useStore();
  const [tab, setTab] = useState<Tab>('Posts');
  const [editing, setEditing] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [locationSettings, setLocationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(false);

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
          <SettingRow label="Notifications" onClick={() => setNotificationSettings(true)} />
          <SettingRow label="Privacy" hint="Coming soon" />
          <SettingRow label="Location settings" onClick={() => setLocationSettings(true)} />
          <button onClick={() => { signOut(); router.push('/'); }} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span className="font-mono text-sm text-red-700">Log out</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-red-700" strokeWidth={1.6}><path d="M15 12H4m0 0l3-3m-3 3l3 3M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        {isDemoMode && <p className="mt-3 text-center font-mono text-[0.65rem] text-coffee/45">Demo mode — profile changes are saved in this browser only.</p>}
      </div>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
      {locationSettings && <LocationSettingsModal onClose={() => setLocationSettings(false)} />}
      {notificationSettings && <NotificationSettingsModal onClose={() => setNotificationSettings(false)} />}
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

type GeoStatus = 'checking' | 'granted' | 'denied' | 'prompt' | 'unsupported';

function LocationSettingsModal({ onClose }: { onClose: () => void }) {
  const { me, updateProfile } = useStore();
  const [status, setStatus] = useState<GeoStatus>('checking');
  const [requesting, setRequesting] = useState(false);
  const [homeLocation, setHomeLocation] = useState(me?.location ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setStatus('unsupported'); return; }
    if (!navigator.permissions?.query) { setStatus('prompt'); return; }
    let alive = true;
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
      if (!alive) return;
      setStatus(result.state as GeoStatus);
      result.onchange = () => setStatus(result.state as GeoStatus);
    }).catch(() => setStatus('prompt'));
    return () => { alive = false; };
  }, []);

  function enableLocation() {
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => { setStatus('granted'); setRequesting(false); },
      () => { setStatus('denied'); setRequesting(false); },
      { timeout: 8000 },
    );
  }

  function saveHomeLocation() {
    updateProfile({ location: homeLocation.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const statusCopy: Record<GeoStatus, string> = {
    checking: 'Checking…',
    granted: 'Enabled',
    denied: 'Off — blocked in your browser',
    prompt: 'Not enabled',
    unsupported: 'Not available on this device',
  };

  return (
    <Modal open onClose={onClose} title="Location settings">
      <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Device location</p>
      <div className="mb-2 flex items-center justify-between rounded-card bg-parchment px-4 py-3">
        <span className="font-mono text-sm text-coffee/80">{statusCopy[status]}</span>
        {status === 'granted' && <span className="h-2 w-2 rounded-full bg-racing-600" />}
      </div>
      <p className="mb-4 text-sm text-coffee/70">
        Used to sort cafés by distance when you tap the <span className="text-racing-700">Nearby</span> filter on Explore. We never share your location.
      </p>
      {status === 'prompt' && (
        <Button className="mb-6 w-full" onClick={enableLocation} disabled={requesting}>
          {requesting ? 'Requesting…' : 'Enable Location Access'}
        </Button>
      )}
      {status === 'denied' && (
        <p className="mb-6 rounded-card bg-amber/5 px-4 py-3 font-mono text-xs text-coffee/60">
          Location is blocked for this site. Enable it from your browser or device&rsquo;s site settings, then come back here.
        </p>
      )}
      {status === 'granted' && (
        <p className="mb-6 font-mono text-xs text-coffee/50">You can turn this off anytime from your browser or device&rsquo;s site settings.</p>
      )}

      <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Home location</p>
      <input
        value={homeLocation} onChange={(e) => setHomeLocation(e.target.value)}
        placeholder="e.g. Austin, TX"
        className="mb-2 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600"
      />
      <p className="mb-4 font-mono text-xs text-coffee/50">Shown on your profile — separate from device location.</p>
      <Button variant="outline" className="w-full" onClick={saveHomeLocation}>{saved ? 'Saved!' : 'Save home location'}</Button>
    </Modal>
  );
}

type PushStatus = 'checking' | 'unsupported' | 'ios-needs-install' | 'blocked' | 'prompt' | 'enabled';

function NotificationSettingsModal({ onClose }: { onClose: () => void }) {
  const { me, updateProfile, enablePush, disablePush } = useStore();
  const [pushStatus, setPushStatus] = useState<PushStatus>('checking');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isPushSupported()) { setPushStatus('unsupported'); return; }
      if (isIOS() && !isStandalone()) { setPushStatus('ios-needs-install'); return; }
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') { setPushStatus('blocked'); return; }
      const existing = await getExistingSubscription();
      if (!alive) return;
      setPushStatus(existing ? 'enabled' : 'prompt');
    })();
    return () => { alive = false; };
  }, []);

  async function enable() {
    setPushBusy(true);
    setPushError('');
    try {
      const sub = await subscribeToPush();
      const result = await enablePush(sub.toJSON() as PushSubscriptionJSON);
      if (!result.ok) throw new Error(result.error || 'Could not save subscription.');
      setPushStatus('enabled');
    } catch (err: any) {
      setPushError(err?.message || 'Something went wrong enabling push.');
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setPushStatus('blocked');
    } finally {
      setPushBusy(false);
    }
  }

  async function disable() {
    setPushBusy(true);
    setPushError('');
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) disablePush(endpoint);
      setPushStatus('prompt');
    } catch (err: any) {
      setPushError(err?.message || 'Something went wrong turning this off.');
    } finally {
      setPushBusy(false);
    }
  }

  if (!me) return null;

  const rows: { key: 'notifyLikesComments' | 'notifyFollows' | 'notifyActivityUpdates' | 'notifyNearbyNudges'; label: string; hint: string }[] = [
    { key: 'notifyLikesComments', label: 'Likes & comments', hint: 'When someone likes or comments on your posts.' },
    { key: 'notifyFollows', label: 'Follows', hint: 'When someone starts following you.' },
    { key: 'notifyActivityUpdates', label: 'Suggestion & claim updates', hint: 'When your café suggestions, edit reports, or claims are reviewed.' },
    { key: 'notifyNearbyNudges', label: 'Nearby café nudges', hint: 'When you’re close to a café on your Want To Go or Favorites list (while Explore is open).' },
  ];
  const radiusMiles = me.notifyNearbyRadiusMiles ?? 1;

  return (
    <Modal open onClose={onClose} title="Notifications">
      <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">Push notifications</p>
      <div className="mb-2 flex items-center justify-between rounded-card bg-parchment px-4 py-3">
        <span className="font-mono text-sm text-coffee/80">
          {pushStatus === 'checking' && 'Checking…'}
          {pushStatus === 'unsupported' && 'Not available on this browser'}
          {pushStatus === 'ios-needs-install' && 'Add to Home Screen first'}
          {pushStatus === 'blocked' && 'Off — blocked in your browser'}
          {pushStatus === 'prompt' && 'Not enabled'}
          {pushStatus === 'enabled' && 'Enabled on this device'}
        </span>
        {pushStatus === 'enabled' && <span className="h-2 w-2 rounded-full bg-racing-600" />}
      </div>

      {pushStatus === 'ios-needs-install' && (
        <p className="mb-4 rounded-card bg-amber/5 px-4 py-3 font-mono text-xs text-coffee/60">
          On iPhone, push only works once Where&rsquo;s Joe? is added to your Home Screen. Tap the Share button in Safari, then &ldquo;Add to Home Screen,&rdquo; then open it from there and come back to this screen.
        </p>
      )}
      {pushStatus === 'blocked' && (
        <p className="mb-4 rounded-card bg-amber/5 px-4 py-3 font-mono text-xs text-coffee/60">
          Notifications are blocked for this site. Enable them from your browser or device&rsquo;s site settings, then come back here.
        </p>
      )}
      {pushStatus === 'prompt' && (
        <Button className="mb-2 w-full" onClick={enable} disabled={pushBusy}>
          {pushBusy ? 'Enabling…' : 'Enable Push Notifications'}
        </Button>
      )}
      {pushStatus === 'enabled' && (
        <Button variant="outline" className="mb-2 w-full" onClick={disable} disabled={pushBusy}>
          {pushBusy ? 'Turning off…' : 'Turn off on this device'}
        </Button>
      )}
      {pushError && <p className="mb-2 font-mono text-[0.65rem] text-red-700">{pushError}</p>}
      <p className="mb-6 font-mono text-xs text-coffee/50">Alerts you even when Where&rsquo;s Joe? is closed.</p>

      <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">What you get notified about</p>
      <div className="mb-2 divide-y divide-racing-100 overflow-hidden rounded-card border border-racing-100">
        {rows.map((row) => {
          const on = me[row.key] !== false;
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-coffee/80">{row.label}</p>
                  <p className="mt-0.5 font-mono text-[0.65rem] text-coffee/45">{row.hint}</p>
                </div>
                <button
                  onClick={() => updateProfile({ [row.key]: !on })}
                  aria-pressed={on}
                  className={`shrink-0 rounded-pill px-3 py-1.5 font-mono text-xs transition-colors ${on ? 'bg-racing-600 text-ivory' : 'border border-racing-100 text-coffee/50'}`}
                >
                  {on ? 'On' : 'Off'}
                </button>
              </div>
              {row.key === 'notifyNearbyNudges' && on && (
                <div className="bg-parchment/40 px-4 py-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] text-coffee/60">Nudge distance</span>
                    <span className="font-mono text-xs text-racing-700">{radiusMiles} mi</span>
                  </div>
                  <input
                    type="range" min={1} max={10} step={1} value={radiusMiles}
                    onChange={(e) => updateProfile({ notifyNearbyRadiusMiles: Number(e.target.value) })}
                    className="w-full accent-racing-600"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
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
