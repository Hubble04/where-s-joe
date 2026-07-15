'use client';
import { useEffect } from 'react';
import { StoreProvider } from '@/lib/store';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return (
    <StoreProvider>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ivory">
        <TopBar />
        <main className="flex-1 pb-2">{children}</main>
        <BottomNav />
      </div>
    </StoreProvider>
  );
}
