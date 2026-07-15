'use client';
import Link from 'next/link';
import { LOGOS } from '@/lib/brand';
import { isDemoMode } from '@/lib/env';
import { useStore } from '@/lib/store';
import { ImageWithFallback } from './ImageWithFallback';

export function TopBar() {
  const { me } = useStore();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-racing-100 bg-ivory/90 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGOS.primaryCupQM} alt="" className="h-8 w-8" />
        <span className="font-display text-xl leading-none text-racing-700">Where&rsquo;s Joe?</span>
      </Link>
      <div className="flex items-center gap-2">
        {isDemoMode && (
          <span className="rounded-pill bg-amber/15 px-2 py-1 text-[0.65rem] font-mono text-amber-dark">Demo</span>
        )}
        <Link href="/profile" aria-label="Profile">
          {me ? (
            <ImageWithFallback src={me.profilePhotoUrl} alt={me.name} seed={me.name} className="h-8 w-8 rounded-full" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-racing-600 text-ivory text-xs">?</span>
          )}
        </Link>
      </div>
    </header>
  );
}
