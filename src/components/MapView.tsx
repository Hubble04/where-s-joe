'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Cafe } from '@/lib/types';
import { hasMapbox, env } from '@/lib/env';
import { cn, monogram } from '@/lib/utils';
import 'mapbox-gl/dist/mapbox-gl.css';

type Props = { cafes: Cafe[]; className?: string; origin?: { lat: number; lng: number } | null };

export function MapView(props: Props) {
  return hasMapbox ? <MapboxMap {...props} /> : <StaticMap {...props} />;
}

function MapboxMap({ cafes, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let map: any;
    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = env.mapboxToken;
      if (!ref.current) return;
      const center: [number, number] = cafes[0] ? [cafes[0].lng, cafes[0].lat] : [-97.7431, 30.2672];
      map = new mapboxgl.Map({ container: ref.current, style: 'mapbox://styles/mapbox/light-v11', center, zoom: 12 });
      map.on('load', () => setLoaded(true));
      cafes.forEach((c) => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#19452B;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);color:#FDFAED;font:600 12px monospace">${monogram(c.name)}</span></div>`;
        const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(
          `<a href="/cafe/${c.id}" style="display:block;padding:10px 12px;color:#19452B;text-decoration:none"><strong>${c.name}</strong><br><span style="color:#7A4A31;font-size:12px">${c.neighborhood}</span></a>`,
        );
        new mapboxgl.Marker(el).setLngLat([c.lng, c.lat]).setPopup(popup).addTo(map);
      });
    })();
    return () => map?.remove();
  }, [cafes]);
  return (
    <div className={cn('relative overflow-hidden rounded-card', className)}>
      <div ref={ref} className="h-full w-full" />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-parchment font-mono text-sm text-coffee/50">Loading map…</div>}
    </div>
  );
}

/** No token → project coords onto a stylised street panel. */
function StaticMap({ cafes, className }: Props) {
  const [sel, setSel] = useState<Cafe | null>(null);
  const lats = cafes.map((c) => c.lat), lngs = cafes.map((c) => c.lng);
  const minLat = Math.min(...lats) - 0.01, maxLat = Math.max(...lats) + 0.01;
  const minLng = Math.min(...lngs) - 0.01, maxLng = Math.max(...lngs) + 0.01;
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div className={cn('relative overflow-hidden rounded-card border border-racing-100', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <rect width="100" height="100" fill="#EFE9D6" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={'h' + i} x1="0" y1={i * 12.5} x2="100" y2={i * 12.5} stroke="#19452B" strokeWidth="0.2" opacity="0.15" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={'v' + i} x1={i * 12.5} y1="0" x2={i * 12.5} y2="100" stroke="#19452B" strokeWidth="0.2" opacity="0.15" />
        ))}
        <path d="M0 62 Q50 55 100 68" stroke="#33578F" strokeWidth="0.8" fill="none" opacity="0.3" />
      </svg>
      {cafes.map((c) => (
        <button
          key={c.id} onClick={() => setSel(c)}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${x(c.lng)}%`, top: `${y(c.lat)}%` }}
          aria-label={c.name}
        >
          <span className="flex h-7 w-7 rotate-45 items-center justify-center rounded-[50%_50%_50%_0] bg-racing-600 shadow-lift">
            <span className="-rotate-45 font-mono text-[0.6rem] text-ivory">{monogram(c.name)}</span>
          </span>
        </button>
      ))}
      {sel && (
        <Link href={`/cafe/${sel.id}`} className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-card bg-ivory/95 p-2 shadow-lift backdrop-blur">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-base text-racing-700">{sel.name}</span>
            <span className="block truncate font-mono text-xs text-coffee/60">{sel.neighborhood} · tap to open</span>
          </span>
          <span className="font-mono text-xs text-racing-600">→</span>
        </Link>
      )}
      <span className="absolute right-2 top-2 rounded-pill bg-ivory/80 px-2 py-0.5 font-mono text-[0.6rem] text-coffee/50">Static map · add a Mapbox token for live</span>
    </div>
  );
}
