'use client';
import { useState } from 'react';
import { LOGOS } from '@/lib/brand';

/** Visual placeholder for the future "Bean" AI guide. Intentionally inert. */
export function BeanCard() {
  const [nudge, setNudge] = useState(false);
  return (
    <button
      onClick={() => setNudge(true)}
      className="flex w-full items-center gap-3 rounded-card border border-amber/30 bg-amber/5 px-4 py-3 text-left transition-colors hover:bg-amber/10"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGOS.iconAmber} alt="" className="h-9 w-9 rounded-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-base text-racing-700">Ask Bean where to sip next</span>
        <span className="block font-mono text-xs text-coffee/55">
          {nudge ? 'Bean is brewing — AI guidance is coming soon.' : 'Your coffee guide, coming soon.'}
        </span>
      </span>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-amber-dark" strokeWidth={1.6}><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
