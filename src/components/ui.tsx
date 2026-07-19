'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from './ImageWithFallback';

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  return <ImageWithFallback src={src} alt={name} seed={name} className={cn('rounded-full', className)} />;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between">
        <div>
          {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
          <h2 className="font-display text-2xl text-racing-700">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-3 border-t border-racing-100" />
    </div>
  );
}

/** Editorial "spec sheet" row list — label:value pairs divided by hairlines, like a coffee-bag label or a watch spec table. */
export function SpecList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="divide-y divide-racing-100 border-y border-racing-100">
      {items.map((it, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2.5">
          <span className="shrink-0 pt-px font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">{it.label}</span>
          <span className="text-right font-mono text-sm leading-relaxed text-coffee/85">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="paper flex flex-col items-center rounded-card px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-racing-600/10">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-racing-600" strokeWidth={1.5}>
          <path d="M4 8h13a3 3 0 0 1 0 6h-1M4 8v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3M8 3v2M11 3v2" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-heading text-lg text-racing-700">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-coffee/70">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-pill border border-racing-100 bg-ivory px-4 py-2.5 shadow-card">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-coffee/50" strokeWidth={1.8}>
        <circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" strokeLinecap="round" />
      </svg>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search cafés, city, vibe, drink…'}
        className="w-full bg-transparent font-mono text-sm text-coffee placeholder:text-coffee/40 focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear" className="text-coffee/40 hover:text-coffee">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  );
}

export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-pill border px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-wide transition-colors',
        active ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 bg-ivory text-coffee/70 hover:border-racing-300',
      )}
    >
      {label}
    </button>
  );
}

export function TagChip({ label }: { label: string }) {
  return <span className="rounded-pill bg-parchment px-2.5 py-1 font-mono text-[0.7rem] text-coffee/80">{label}</span>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-racing-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-card bg-ivory p-5 shadow-lift sm:rounded-card animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-racing-700">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-coffee/50 hover:text-coffee">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={1.8}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SignInPrompt({ message }: { message: string }) {
  return (
    <div className="paper rounded-card p-5 text-center">
      <p className="text-sm text-coffee/80">{message}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Link href="/login" className="rounded-pill bg-racing-600 px-4 py-2 font-mono text-sm text-ivory">Log in</Link>
        <Link href="/signup" className="rounded-pill border border-racing-200 px-4 py-2 font-mono text-sm text-racing-700">Sign up</Link>
      </div>
    </div>
  );
}
