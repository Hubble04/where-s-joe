'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Explore', match: (p: string) => p === '/' || p.startsWith('/cafe') },
  { href: '/community', label: 'Community', match: (p: string) => p.startsWith('/community') || p.startsWith('/suggest') },
  { href: '/journey', label: 'Journey', match: (p: string) => p.startsWith('/journey') },
  { href: '/profile', label: 'Profile', match: (p: string) => p.startsWith('/profile') },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const c = active ? 'stroke-racing-700' : 'stroke-coffee/50';
  const common = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: cn('h-6 w-6', c) };
  switch (name) {
    case 'Explore': return <svg viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>;
    case 'Community': return <svg viewBox="0 0 24 24" {...common}><path d="M17 20v-2a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v2" /><circle cx="10" cy="8" r="3.2" /><path d="M21 20v-2a3 3 0 0 0-2.2-2.9" /><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6" /></svg>;
    case 'Journey': return <svg viewBox="0 0 24 24" {...common}><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'Profile': return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    default: return null;
  }
}

export function BottomNav() {
  const pathname = usePathname() || '/';
  return (
    <nav className="sticky bottom-0 z-30 border-t border-racing-100 bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link key={t.href} href={t.href} className="flex flex-1 flex-col items-center gap-1 py-2.5">
              <Icon name={t.label} active={active} />
              <span className={cn('font-mono text-[0.65rem]', active ? 'text-racing-700' : 'text-coffee/50')}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
