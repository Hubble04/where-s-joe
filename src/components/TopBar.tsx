'use client';
import Link from 'next/link';
import { LOGOS } from '@/lib/brand';
import { isDemoMode } from '@/lib/env';
import { useStore } from '@/lib/store';
import { ImageWithFallback } from './ImageWithFallback';

export function TopBar() {
  const { me, notifications } = useStore();
  const unread = me ? notifications.filter((n) => !n.read).length : 0;
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
        {me && (
          <Link href="/notifications" aria-label="Notifications" className="relative flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-racing-700" strokeWidth={1.7}>
              <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z M10 19a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unread > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 font-mono text-[0.6rem] text-ivory">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
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
