'use client';
import Link from 'next/link';
import type { Cafe, CafeSave } from '@/lib/types';
import { monogram, coordLabel, formatStampDate } from '@/lib/utils';

/** A rubber-stamp badge for a visited café — the signature Passport element. */
export function PassportStamp({ cafe, save, index = 0 }: { cafe: Cafe; save?: CafeSave; index?: number }) {
  const rot = [-6, 4, -3, 7, -5, 3][index % 6];
  const inks = ['#19452B', '#502A19', '#1B3A73', '#5C4E19'];
  const ink = inks[index % inks.length];
  const date = save ? formatStampDate(save.createdAt) : '';
  const cid = cafe.id.replace(/[^a-z0-9]/gi, '').slice(0, 6);

  return (
    <Link href={`/cafe/${cafe.id}`} className="block">
      <div className="animate-stamp-in" style={{ ['--stamp-rot' as any]: `${rot}deg`, transform: `rotate(${rot}deg)` }}>
        <svg viewBox="0 0 160 160" className="h-full w-full" style={{ color: ink }}>
          <defs>
            <path id={`arc-top-${cid}`} d="M 30 80 A 50 50 0 0 1 130 80" fill="none" />
            <path id={`arc-bot-${cid}`} d="M 130 84 A 50 50 0 0 1 30 84" fill="none" />
          </defs>
          <circle cx="80" cy="80" r="62" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
          <circle cx="80" cy="80" r="55" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" strokeDasharray="2 3" />
          <text fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.5" fill="currentColor" opacity="0.8">
            <textPath href={`#arc-top-${cid}`} startOffset="50%" textAnchor="middle">{cafe.neighborhood?.toUpperCase()}</textPath>
          </text>
          <text fontFamily="var(--font-mono)" fontSize="7" letterSpacing="1" fill="currentColor" opacity="0.6">
            <textPath href={`#arc-bot-${cid}`} startOffset="50%" textAnchor="middle">{coordLabel(cafe.lat, cafe.lng)}</textPath>
          </text>
          <text x="80" y="74" textAnchor="middle" fontFamily="var(--font-display)" fontSize="34" fill="currentColor">{monogram(cafe.name)}</text>
          <text x="80" y="92" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="1" fill="currentColor" opacity="0.85">{cafe.city?.toUpperCase()}, {cafe.state}</text>
          {date && <text x="80" y="104" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="currentColor" opacity="0.7">{date}</text>}
        </svg>
      </div>
    </Link>
  );
}

/** Ghost placeholder for a café not yet visited. */
export function GhostStamp({ cafe }: { cafe: Cafe }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-full border border-dashed border-coffee/20">
      <span className="font-display text-2xl text-coffee/20">{monogram(cafe.name)}</span>
    </div>
  );
}
