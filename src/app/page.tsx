'use client';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { QUICK_FILTERS } from '@/lib/brand';
import { isOpenNow, distanceMiles } from '@/lib/utils';
import { CafeCard, CafeCardSkeleton } from '@/components/CafeCard';
import { MapView } from '@/components/MapView';
import { SearchBar, Chip, EmptyState, SectionTitle } from '@/components/ui';
import { BeanCard } from '@/components/BeanCard';

export default function ExplorePage() {
  const { ready, cafes } = useStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  function toggleFilter(f: string) {
    if (f === 'Nearby' && !origin) requestLocation();
    setActive((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  }

  function requestLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLocationDenied(true); return; }
    setLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); setLocationDenied(true); },
      { timeout: 8000 },
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cafes.filter((c) => {
      if (q) {
        const hay = [c.name, c.city, c.state, c.neighborhood, c.signatureDrink, ...(c.tags || [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const f of active) {
        if (f === 'Open Now' && isOpenNow(c) === false) return false;
        else if (f === 'Verified by Joe' && !c.verifiedByJoe) return false;
        else if (f === 'Wi-Fi' && !c.tags.includes('Wi-Fi')) return false;
        else if (f === 'Outdoor Seating' && !c.tags.includes('Outdoor Seating')) return false;
        else if (f === 'Parking' && !c.tags.includes('Parking')) return false;
      }
      return true;
    });
    if (origin && active.includes('Nearby')) {
      list = [...list].sort((a, b) => distanceMiles(origin, { lat: a.lat, lng: a.lng }) - distanceMiles(origin, { lat: b.lat, lng: b.lng }));
    }
    return list;
  }, [cafes, query, active, origin]);

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <p className="eyebrow mb-1">Independent coffee near you</p>
        <h1 className="font-display text-3xl leading-tight text-racing-700">Where will you sip next?</h1>
      </div>

      <BeanCard />

      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <div className="rail mt-3">
        {QUICK_FILTERS.map((f) => (
          <Chip key={f} label={f === 'Nearby' && locating ? 'Locating…' : f} active={active.includes(f)} onClick={() => toggleFilter(f)} />
        ))}
      </div>
      {active.includes('Nearby') && !origin && locationDenied && (
        <p className="mt-2 font-mono text-xs text-coffee/60">
          Location access is off, so distance sorting is unavailable — showing every café. Try searching a city or neighborhood above instead.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-xs text-coffee/60">{filtered.length} café{filtered.length === 1 ? '' : 's'}</p>
        <div className="flex rounded-pill border border-racing-100 p-0.5">
          {(['list', 'map'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-pill px-3 py-1 font-mono text-xs capitalize ${view === v ? 'bg-racing-600 text-ivory' : 'text-coffee/60'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {!ready ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CafeCardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No cafés match" body="Try clearing a filter or searching a different vibe." />
        ) : view === 'map' ? (
          <MapView cafes={filtered} origin={origin} className="h-[60vh] w-full" />
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => <CafeCard key={c.id} cafe={c} origin={active.includes('Nearby') ? origin : null} />)}
          </div>
        )}
      </div>

      {ready && view === 'list' && (
        <div className="mt-8">
          <SectionTitle eyebrow="Fresh on the map" title="Newly added" />
          <div className="rail">
            {[...cafes].slice(-4).reverse().map((c) => <CafeCard key={c.id} cafe={c} variant="rail" />)}
          </div>
        </div>
      )}
    </div>
  );
}
