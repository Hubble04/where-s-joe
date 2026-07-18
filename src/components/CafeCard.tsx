'use client';
import Link from 'next/link';
import type { Cafe } from '@/lib/types';
import { cn, isOpenNow, distanceMiles } from '@/lib/utils';
import { ImageWithFallback } from './ImageWithFallback';
import { Rating, VerifiedBadge } from './Badge';

export function CafeCard({ cafe, origin, variant = 'feed' }: { cafe: Cafe; origin?: { lat: number; lng: number } | null; variant?: 'feed' | 'rail' | 'compact' }) {
  const open = isOpenNow(cafe);
  const dist = origin ? distanceMiles(origin, { lat: cafe.lat, lng: cafe.lng }) : null;

  if (variant === 'rail') {
    return (
      <Link href={`/cafe/${cafe.id}`} className="block w-60">
        <div className="overflow-hidden rounded-card bg-ivory shadow-card">
          <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="aspect-[4/3] w-full" />
          <div className="p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-display text-lg text-racing-700">{cafe.name}</h3>
              {cafe.verifiedByJoe && <span className="h-2 w-2 shrink-0 rounded-full bg-racing-600" title="Verified by Joe" />}
            </div>
            <p className="truncate font-mono text-xs text-coffee/60">{cafe.neighborhood}</p>
          </div>
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
      <article className="overflow-hidden rounded-card bg-ivory shadow-card transition-shadow hover:shadow-lift">
        <div className="relative">
          <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="aspect-[16/10] w-full" />
          <div className="absolute left-3 top-3 flex gap-2">
            {cafe.verifiedByJoe && <VerifiedBadge />}
          </div>
          {open != null && (
            <span className={cn('absolute right-3 top-3 rounded-pill px-2.5 py-1 font-mono text-[0.65rem]', open ? 'bg-racing-600 text-ivory' : 'bg-coffee/70 text-ivory')}>
              {open ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl text-racing-700">{cafe.name}</h3>
            <Rating value={cafe.rating} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-coffee/60">
            {cafe.neighborhood} · {cafe.city}, {cafe.state}
            {dist != null && <> · {dist.toFixed(1)} mi</>}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-coffee/80">{cafe.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cafe.tags.slice(0, 4).map((t) => <span key={t} className="rounded-pill bg-parchment px-2.5 py-1 font-mono text-[0.7rem] text-coffee/80">{t}</span>)}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function CafeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-ivory shadow-card">
      <div className="aspect-[16/10] w-full animate-pulse bg-parchment" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-parchment" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-parchment" />
        <div className="h-3 w-full animate-pulse rounded bg-parchment" />
      </div>
    </div>
  );
}
