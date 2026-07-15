'use client';
import { useState } from 'react';
import { cn, fallbackGradient, monogram } from '@/lib/utils';

/** <img> that degrades to a warm brand gradient + monogram, never a broken icon. */
export function ImageWithFallback({
  src, alt, seed, className, monogramText,
}: { src?: string; alt: string; seed: string; className?: string; monogramText?: string }) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={cn('relative overflow-hidden bg-parchment', className)}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ background: fallbackGradient(seed) }}>
          <span className="font-display text-3xl text-ivory/90">{monogramText ?? monogram(seed)}</span>
        </div>
      )}
    </div>
  );
}
