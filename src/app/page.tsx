'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { QUICK_FILTERS } from '@/lib/brand';
import type { Cafe } from '@/lib/types';
import { isOpenNow, distanceMiles } from '@/lib/utils';
import { CafeCard, CafeCardSkeleton } from '@/components/CafeCard';
import { MapView } from '@/components/MapView';
import { SearchBar, Chip, EmptyState, SectionTitle, Modal } from '@/components/ui';
import { BeanCard } from '@/components/BeanCard';
import { Button } from '@/components/Button';
import { ImageWithFallback } from '@/components/ImageWithFallback';

const PAGE_SIZE = 20;
const NEARBY_RADIUS_MILES = 15;
const SURPRISE_RADIUS_MILES = 20;

export default function ExplorePage() {
  const router = useRouter();
  const { ready, cafes, me, savesByType, getCafe } = useStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string[]>([]);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [nudgedCafeIds, setNudgedCafeIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [surpriseError, setSurpriseError] = useState('');
  const [surpriseCafe, setSurpriseCafe] = useState<Cafe | null>(null);

  function toggleFilter(f: string) {
    setActive((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  }

  const nearbyActive = active.includes('Nearby');

  // While Nearby is on, keep watching position instead of grabbing it once, so
  // the list keeps re-sorting as the user actually moves around.
  useEffect(() => {
    if (!nearbyActive) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setLocationDenied(true); return; }
    setLocating(true);
    setLocationDenied(false);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); setLocationDenied(true); },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [nearbyActive]);

  // If location access was already granted (e.g. from Location Settings, or a
  // previous visit), turn Nearby on automatically instead of waiting for a tap.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions?.query) return;
    let alive = true;
    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
      if (!alive || result.state !== 'granted') return;
      setActive((a) => (a.includes('Nearby') ? a : [...a, 'Nearby']));
    }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nudge the user when a saved (Want To Go / Favorite) café is nearby, while
  // Explore is open. Each café only nudges once per visit.
  useEffect(() => {
    if (!nearbyActive || !origin || !me) return;
    if (me.notifyNearbyNudges === false) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

    const watchlistCafeIds = new Set([
      ...savesByType('want_to_go').map((s) => s.cafeId),
      ...savesByType('favorite').map((s) => s.cafeId),
    ]);

    const radiusMiles = me.notifyNearbyRadiusMiles ?? 1;
    watchlistCafeIds.forEach((cafeId) => {
      if (nudgedCafeIds.has(cafeId)) return;
      const cafe = getCafe(cafeId);
      if (!cafe) return;
      const dist = distanceMiles(origin, { lat: cafe.lat, lng: cafe.lng });
      if (dist > radiusMiles) return;

      setNudgedCafeIds((prev) => new Set(prev).add(cafeId));
      const distLabel = dist < 0.1 ? 'right around the corner' : `${dist.toFixed(1)} mi away`;
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Where's Joe?", {
          body: `☕ ${cafe.name} is ${distLabel} — stop in for a cup?`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url: `/cafe/${cafe.id}` },
        } as NotificationOptions);
      }).catch(() => {});
    });
  }, [origin, nearbyActive, me, savesByType, getCafe, nudgedCafeIds]);

  // Admins can see pending/rejected cafés (needed for the Admin dashboard),
  // but Explore is a public-facing view — it should only ever show what's
  // actually published, regardless of who's logged in.
  const publishedCafes = useMemo(() => cafes.filter((c) => c.status === 'approved'), [cafes]);

  function pickFrom(o: { lat: number; lng: number }, exclude?: string) {
    const candidates = publishedCafes.filter((c) => c.id !== exclude && distanceMiles(o, { lat: c.lat, lng: c.lng }) <= SURPRISE_RADIUS_MILES);
    if (candidates.length === 0) {
      setSurpriseError(`No cafés within ${SURPRISE_RADIUS_MILES} mi of you yet.`);
      setSurpriseCafe(null);
    } else {
      setSurpriseError('');
      setSurpriseCafe(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    setSurpriseLoading(false);
  }

  function surpriseMe() {
    setSurpriseOpen(true);
    setSurpriseCafe(null);
    setSurpriseError('');
    if (origin) { pickFrom(origin); return; }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setSurpriseError('Location isn’t available on this device.');
      return;
    }
    setSurpriseLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { const o = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setOrigin(o); pickFrom(o); },
      () => { setSurpriseLoading(false); setSurpriseError('Turn on location access to get a surprise pick.'); },
      { timeout: 8000 },
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = publishedCafes.filter((c) => {
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
      list = list
        .filter((c) => distanceMiles(origin, { lat: c.lat, lng: c.lng }) <= NEARBY_RADIUS_MILES)
        .sort((a, b) => distanceMiles(origin, { lat: a.lat, lng: a.lng }) - distanceMiles(origin, { lat: b.lat, lng: b.lng }));
    }
    return list;
  }, [publishedCafes, query, active, origin]);

  // Reset how many cards are shown whenever the user deliberately changes what
  // they're looking at — but not on every live position update while Nearby
  // tracks movement, which would keep yanking the list back to the top.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, active]);

  const visibleCafes = filtered.slice(0, visibleCount);

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

      <button
        onClick={surpriseMe}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-racing-600 px-4 py-2.5 font-mono text-sm text-ivory transition-colors hover:bg-racing-700"
      >
        🎲 Surprise Me
      </button>

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
        ) : filtered.length === 0 && nearbyActive && origin ? (
          <EmptyState
            title={`No cafés within ${NEARBY_RADIUS_MILES} mi`}
            body="Nothing nearby matches right now. Try turning off Nearby to browse everywhere."
            action={<Button variant="outline" onClick={() => toggleFilter('Nearby')}>Turn off Nearby</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No cafés match" body="Try clearing a filter or searching a different vibe." />
        ) : view === 'map' ? (
          <MapView cafes={filtered} origin={origin} className="h-[60vh] w-full" />
        ) : (
          <>
            <div className="space-y-4">
              {visibleCafes.map((c) => <CafeCard key={c.id} cafe={c} origin={active.includes('Nearby') ? origin : null} />)}
            </div>
            {visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="mt-4 w-full rounded-pill border border-racing-100 py-2.5 text-center font-mono text-sm text-racing-700 transition-colors hover:border-racing-300 hover:bg-racing-50"
              >
                ☕ More Coffee Please
              </button>
            )}
          </>
        )}
      </div>

      {ready && view === 'list' && (
        <div className="mt-8">
          <SectionTitle eyebrow="Fresh on the map" title="Newly added" />
          <div className="rail">
            {[...publishedCafes].slice(-4).reverse().map((c) => <CafeCard key={c.id} cafe={c} variant="rail" />)}
          </div>
        </div>
      )}

      <Modal open={surpriseOpen} onClose={() => setSurpriseOpen(false)} title="✨ Your surprise pick!">
        {surpriseLoading ? (
          <p className="py-6 text-center font-mono text-sm text-coffee/60">Locating…</p>
        ) : surpriseError ? (
          <div className="py-2 text-center">
            <p className="font-mono text-sm text-coffee/70">{surpriseError}</p>
            <Button variant="ghost" className="mt-4" onClick={() => setSurpriseOpen(false)}>Close</Button>
          </div>
        ) : surpriseCafe ? (
          <>
            <ImageWithFallback src={surpriseCafe.coverPhotoUrl} alt={surpriseCafe.name} seed={surpriseCafe.name} className="aspect-[16/10] w-full rounded-card" />
            <h3 className="mt-3 font-display text-2xl text-racing-700">{surpriseCafe.name}</h3>
            <p className="font-mono text-xs text-coffee/60">
              {surpriseCafe.neighborhood} · {surpriseCafe.city}, {surpriseCafe.state}
              {origin && <> · {distanceMiles(origin, { lat: surpriseCafe.lat, lng: surpriseCafe.lng }).toFixed(1)} mi away</>}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => origin && pickFrom(origin, surpriseCafe.id)}>Surprise me again</Button>
              <Button className="flex-1" onClick={() => { setSurpriseOpen(false); router.push(`/cafe/${surpriseCafe.id}`); }}>Take me there</Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
