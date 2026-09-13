'use client';
import { useEffect, useState } from 'react';
import { LOGOS } from '@/lib/brand';
import { Button } from './Button';

const LS_KEY = 'wij_onboarded_v1';

const STEPS = [
  {
    title: "Where's Joe?",
    body: 'Find independent coffee shops worth the trip, and keep track of the ones you love.',
  },
  {
    title: 'Explore, share, save',
    body: 'Browse cafés by vibe and filters, post about your visits, follow other coffee people, and stamp your Coffee Passport as you go.',
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(LS_KEY)) setVisible(true);
    } catch {
      /* no-op */
    }
  }, []);

  function finish() {
    try { window.localStorage.setItem(LS_KEY, '1'); } catch { /* no-op */ }
    setVisible(false);
  }

  function enableLocation() {
    if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(() => {}, () => {});
    finish();
  }

  if (!visible) return null;

  const isLast = step === STEPS.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ivory px-6 py-10">
      <button
        onClick={finish}
        className="self-end font-mono text-xs text-coffee/45 underline decoration-dotted underline-offset-2"
      >
        Skip
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {!isLast ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGOS.primaryCupQM} alt="" className="mb-6 h-24 w-24" />
            <h1 className="font-display text-3xl text-racing-700">{STEPS[step].title}</h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-coffee/75">{STEPS[step].body}</p>
          </>
        ) : (
          <>
            <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-racing-600/10">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-racing-600" strokeWidth={1.6}>
                <path d="M12 21s7-7.58 7-12A7 7 0 1 0 5 9c0 4.42 7 12 7 12z M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="font-display text-3xl text-racing-700">Find cafés near you</h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-coffee/75">
              Turn on location to see nearby cafés and get a nudge when you&rsquo;re close to a spot you&rsquo;ve saved.
            </p>
          </>
        )}
      </div>

      <div className="mb-6 flex justify-center gap-1.5">
        {[...STEPS, null].map((_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-pill ${i === step ? 'bg-racing-600' : 'bg-racing-100'}`} />
        ))}
      </div>

      {!isLast ? (
        <Button size="lg" className="w-full" onClick={() => setStep((s) => s + 1)}>Next</Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={enableLocation}>Enable location</Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={finish}>Maybe later</Button>
        </div>
      )}
    </div>
  );
}
