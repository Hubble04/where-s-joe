import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'racing' | 'gold' | 'amber' | 'navy';
const TONES: Record<Tone, string> = {
  neutral: 'bg-parchment text-coffee',
  racing: 'bg-racing-600 text-ivory',
  gold: 'bg-gold/15 text-gold',
  amber: 'bg-amber/15 text-amber-dark',
  navy: 'bg-navy/10 text-navy',
};

export function Badge({ children, tone = 'neutral', className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[0.7rem] font-mono', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-pill bg-ivory/95 py-1 pl-1 pr-2.5 shadow-card', className)}>
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-racing-600 bg-racing-600">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-none stroke-ivory" strokeWidth={3} aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-mono text-[0.62rem] uppercase tracking-eyebrow text-racing-700">Verified</span>
    </span>
  );
}

export function Rating({ value, count, className }: { value?: number; count?: number; className?: string }) {
  if (!value) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-sm text-coffee', className)}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-amber" aria-hidden>
        <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
      </svg>
      {value.toFixed(1)}
      {count != null && <span className="text-coffee/50">({count})</span>}
    </span>
  );
}
