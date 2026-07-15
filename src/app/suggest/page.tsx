'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { TAG_TAXONOMY } from '@/lib/brand';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Button } from '@/components/Button';
import { SignInPrompt } from '@/components/ui';

const VIBE_TAGS = (TAG_TAXONOMY.find((t) => t.category === 'Atmosphere & Design')?.tags ?? [])
  .concat(['Wi-Fi', 'Outdoor Seating', 'Pet Friendly', 'Roastery']);

export default function SuggestPage() {
  const { me, suggestCafe } = useStore();
  const router = useRouter();
  const [f, setF] = useState({ name: '', address: '', city: '', state: '', country: 'USA', description: '', website: '', instagram: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const toggleTag = (t: string) => setTags((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t]));

  if (!me) {
    return <div className="px-4 py-10"><SignInPrompt message="Log in to suggest a café for the community." /></div>;
  }

  function submit() {
    setError(null);
    if (!f.name.trim() || !f.city.trim()) { setError('Please add at least a name and city.'); return; }
    if (!confirmed) { setError('Please confirm this is an independent café.'); return; }
    suggestCafe({ name: f.name.trim(), address: f.address, city: f.city, state: f.state, country: f.country, description: f.description, website: f.website || undefined, instagram: f.instagram || undefined, photoUrl: photos[0], tags });
    setDone(true);
  }

  if (done) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-racing-600/10">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-racing-600" strokeWidth={1.6}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="font-display text-2xl text-racing-700">Thanks for helping grow the<br />Where&rsquo;s Joe? community.</h1>
        <p className="mt-2 text-sm text-coffee/70">Your café suggestion is under review.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => { setDone(false); setF({ name: '', address: '', city: '', state: '', country: 'USA', description: '', website: '', instagram: '' }); setTags([]); setPhotos([]); setConfirmed(false); }}>Suggest another</Button>
          <Button onClick={() => router.push('/community')}>Back to Community</Button>
        </div>
      </div>
    );
  }

  const field = 'w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600';
  const lbl = 'mb-1 block font-mono text-xs text-coffee/60';

  return (
    <div className="px-4 py-4">
      <p className="eyebrow mb-1">Grow the map</p>
      <h1 className="mb-4 font-display text-3xl text-racing-700">Suggest a new café</h1>

      <div className="space-y-3">
        <div><label className={lbl}>Café name *</label><input className={field} value={f.name} onChange={set('name')} /></div>
        <div><label className={lbl}>Address</label><input className={field} value={f.address} onChange={set('address')} /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={lbl}>City *</label><input className={field} value={f.city} onChange={set('city')} /></div>
          <div><label className={lbl}>State</label><input className={field} value={f.state} onChange={set('state')} /></div>
          <div><label className={lbl}>Country</label><input className={field} value={f.country} onChange={set('country')} /></div>
        </div>
        <div><label className={lbl}>Description</label><textarea rows={3} className={`${field} resize-none`} value={f.description} onChange={set('description')} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lbl}>Website</label><input className={field} value={f.website} onChange={set('website')} placeholder="https://" /></div>
          <div><label className={lbl}>Instagram</label><input className={field} value={f.instagram} onChange={set('instagram')} placeholder="@handle" /></div>
        </div>

        <div>
          <label className={lbl}>Photo</label>
          <PhotoUpload value={photos} onChange={setPhotos} multiple={false} label="Add photo" />
        </div>

        <div>
          <label className={lbl}>Basic vibe tags</label>
          <div className="flex flex-wrap gap-1.5">
            {VIBE_TAGS.map((t) => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`rounded-pill border px-2.5 py-1 font-mono text-[0.7rem] ${tags.includes(t) ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 text-coffee/70'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-card bg-parchment p-3">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-racing-600" />
          <span className="font-mono text-xs text-coffee/80">I confirm this is an independent café, not a chain.</span>
        </label>

        {error && <p className="font-mono text-xs text-red-700">{error}</p>}
        <Button className="w-full" size="lg" onClick={submit}>Submit for review</Button>
      </div>
    </div>
  );
}
