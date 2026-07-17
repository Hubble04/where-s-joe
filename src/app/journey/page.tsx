'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { CafeCard } from '@/components/CafeCard';
import { MapView } from '@/components/MapView';
import { PassportStamp } from '@/components/PassportStamp';
import { EmptyState, Modal, SignInPrompt, Chip } from '@/components/ui';
import { Button } from '@/components/Button';
import { formatStampDate } from '@/lib/utils';

const SECTIONS = ['Want To Go', 'Sipped There', 'Favorites', 'Lists'] as const;
type Section = typeof SECTIONS[number];

export default function JourneyPage() {
  const { me, savesByType, getCafe, listsForMe } = useStore();
  const [section, setSection] = useState<Section>('Want To Go');
  const [wtgView, setWtgView] = useState<'list' | 'map'>('list');

  if (!me) {
    return (
      <div className="px-4 py-4">
        <p className="eyebrow mb-1">Your coffee passport</p>
        <h1 className="mb-4 font-display text-3xl text-racing-700">Journey</h1>
        <SignInPrompt message="Log in to start your Coffee Passport — save cafés, stamp your visits, and build lists." />
      </div>
    );
  }

  const wtg = savesByType('want_to_go').map((s) => ({ save: s, cafe: getCafe(s.cafeId) })).filter((x) => x.cafe);
  const sipped = savesByType('sipped_there').map((s) => ({ save: s, cafe: getCafe(s.cafeId) })).filter((x) => x.cafe);
  const favs = savesByType('favorite').map((s) => ({ save: s, cafe: getCafe(s.cafeId) })).filter((x) => x.cafe);

  return (
    <div className="px-4 py-4">
      <p className="eyebrow mb-1">Your coffee passport</p>
      <h1 className="mb-4 font-display text-3xl text-racing-700">Journey</h1>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Sipped" value={sipped.length} />
        <Stat label="Want To Go" value={wtg.length} />
        <Stat label="Favorites" value={favs.length} />
      </div>

      <div className="rail mb-4">
        {SECTIONS.map((s) => <Chip key={s} label={s} active={section === s} onClick={() => setSection(s)} />)}
      </div>

      {section === 'Want To Go' && (
        wtg.length === 0 ? <EmptyState title="Nothing saved yet" body="Tap Want To Go on any café to plan your next visit." action={<Link href="/"><Button>Explore cafés</Button></Link>} /> : (
          <>
            <ViewToggle view={wtgView} onChange={setWtgView} />
            {wtgView === 'map'
              ? <MapView cafes={wtg.map((x) => x.cafe!)} className="h-[55vh] w-full" />
              : <div className="space-y-3">{wtg.map(({ cafe }) => <CafeCard key={cafe!.id} cafe={cafe!} variant="compact" />)}</div>}
          </>
        )
      )}

      {section === 'Sipped There' && (
        sipped.length === 0 ? <EmptyState title="No stamps yet" body="Mark a café as Sipped There to earn your first passport stamp." /> : (
          <div className="grid grid-cols-2 gap-4 pt-2">
            {sipped.map(({ cafe, save }, i) => (
              <div key={cafe!.id} className="flex flex-col items-center">
                <PassportStamp cafe={cafe!} save={save} index={i} />
                <p className="mt-1 text-center font-display text-base text-racing-700">{cafe!.name}</p>
                {save.createdAt && <p className="font-mono text-[0.65rem] text-coffee/50">{formatStampDate(save.createdAt)}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {section === 'Favorites' && (
        favs.length === 0 ? <EmptyState title="No favorites yet" body="Tap the heart on a café to keep it close." /> : (
          <div className="space-y-3">{favs.map(({ cafe }) => <CafeCard key={cafe!.id} cafe={cafe!} variant="compact" />)}</div>
        )
      )}

      {section === 'Lists' && <ListsSection />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-parchment px-3 py-3 text-center">
      <div className="font-display text-2xl text-racing-700">{value}</div>
      <div className="font-mono text-[0.65rem] text-coffee/55">{label}</div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: 'list' | 'map'; onChange: (v: 'list' | 'map') => void }) {
  return (
    <div className="mb-3 flex justify-end">
      <div className="flex rounded-pill border border-racing-100 p-0.5">
        {(['list', 'map'] as const).map((v) => (
          <button key={v} onClick={() => onChange(v)} className={`rounded-pill px-3 py-1 font-mono text-xs capitalize ${view === v ? 'bg-racing-600 text-ivory' : 'text-coffee/60'}`}>{v}</button>
        ))}
      </div>
    </div>
  );
}

function ListsSection() {
  const { listsForMe, getCafe, createList } = useStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const lists = listsForMe();

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>+ New list</Button>
      </div>
      {lists.length === 0 ? (
        <EmptyState title="No lists yet" body="Group cafés into themed lists like 'Weekend Coffee Crawl' or 'Best Study Spots'." action={<Button onClick={() => setCreating(true)}>Create a list</Button>} />
      ) : (
        <div className="space-y-3">
          {lists.map((l) => {
            const cover = l.cafeIds?.map((id) => getCafe(id)).filter(Boolean).slice(0, 3) || [];
            return (
              <Link key={l.id} href={`/journey/list/${l.id}`} className="block rounded-card bg-ivory p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-racing-700">{l.name}</h3>
                  <span className="font-mono text-xs text-coffee/50">{l.cafeIds?.length || 0} cafés</span>
                </div>
                {l.description && <p className="mt-0.5 font-mono text-xs text-coffee/55">{l.description}</p>}
                <div className="mt-2 flex -space-x-2">
                  {cover.map((c, i) => (
                    <span key={i} className="h-9 w-9 overflow-hidden rounded-full border-2 border-ivory">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c!.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New list">
        <label className="mb-1 block font-mono text-xs text-coffee/60">List name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-3 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm" placeholder="e.g. Weekend Coffee Crawl" />
        <label className="mb-1 block font-mono text-xs text-coffee/60">Description (optional)</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm" />
        <Button className="w-full" onClick={() => { if (name.trim()) { createList(name.trim(), desc.trim()); setName(''); setDesc(''); setCreating(false); } }}>Create list</Button>
      </Modal>
    </div>
  );
}
