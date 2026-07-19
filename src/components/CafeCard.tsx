'use client';
import Link from 'next/link';
import type { Cafe } from '@/lib/types';
import { cn, isOpenNow, distanceMiles } from '@/lib/utils';
import { ImageWithFallback } from './ImageWithFallback';
import { Rating, VerifiedBadge } from './Badge';

function locationLine(cafe: Cafe, distMi: number | null) {
  const parts = [cafe.neighborhood, `${cafe.city}, ${cafe.state}`].filter(Boolean);
  if (distMi != null) parts.push(`${distMi.toFixed(1)} mi`);
  return parts.join('  ·  ');
}

export function CafeCard({ cafe, origin, variant = 'feed' }: { cafe: Cafe; origin?: { lat: number; lng: number } | null; variant?: 'feed' | 'rail' | 'compact' }) {
  const open = isOpenNow(cafe);
  const dist = origin ? distanceMiles(origin, { lat: cafe.lat, lng: cafe.lng }) : null;

  if (variant === 'rail') {
    return (
      <Link href={`/cafe/${cafe.id}`} className="block w-56">
        <div className="overflow-hidden rounded-card border border-racing-100">
          <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="aspect-[4/3] w-full" />
        </div>
        <div className="pt-2">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg leading-tight text-racing-700">{cafe.name}</h3>
            {cafe.verifiedByJoe && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-racing-600" title="Verified by Joe" />}
          </div>
          <p className="truncate font-mono text-[0.68rem] uppercase tracking-wide text-coffee/50">{cafe.neighborhood || cafe.city}</p>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/cafe/${cafe.id}`} className="flex items-center gap-3 rounded-card bg-ivory p-2 shadow-card">
        <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg text-racing-700">{cafe.name}</h3>
            {cafe.verifiedByJoe && <span className="h-2 w-2 shrink-0 rounded-full bg-racing-600" />}
          </div>
          <p className="truncate font-mono text-xs text-coffee/60">{cafe.neighborhood} · {cafe.city}, {cafe.state}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {cafe.tags.slice(0, 2).map((t) => <span key={t} className="rounded-pill bg-parchment px-2 py-0.5 font-mono text-[0.65rem] text-coffee/70">{t}</span>)}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/cafe/${cafe.id}`} className="block animate-fade-up">
      <article className="border-b border-racing-100 py-5 first:pt-0">
        <div className="relative overflow-hidden rounded-card">
          <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="aspect-[16/10] w-full" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-racing-900/25 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-2">
            {cafe.verifiedByJoe && <VerifiedBadge />}
          </div>
          {open != null && (
            <span className={cn(
              'absolute right-3 top-3 rounded-pill px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-eyebrow shadow-card',
              open ? 'bg-ivory/95 text-racing-700' : 'bg-racing-900/70 text-ivory',
            )}>
              {open ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        <div className="pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl leading-tight text-racing-700">{cafe.name}</h3>
            <Rating value={cafe.rating} />
          </div>
          <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wide text-coffee/50">
            {locationLine(cafe, dist)}
          </p>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-coffee/80">{cafe.description}</p>
          {cafe.tags.length > 0 && (
            <p className="mt-2.5 font-mono text-[0.68rem] uppercase tracking-wide text-coffee/45">
              {cafe.tags.slice(0, 3).join('  ·  ')}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export function CafeCardSkeleton() {
  return (
    <div className="border-b border-racing-100 py-5">
      <div className="aspect-[16/10] w-full animate-pulse rounded-card bg-parchment" />
      <div className="space-y-2 pt-3.5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-parchment" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-parchment" />
        <div className="h-3 w-full animate-pulse rounded bg-parchment" />
      </div>
    </div>
  );
}
