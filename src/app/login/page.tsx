'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { isDemoMode } from '@/lib/env';
import { LOGOS } from '@/lib/brand';
import { Button } from '@/components/Button';

export default function LoginPage() {
  const { signIn } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim()) { setError('Enter your email.'); return; }
    setBusy(true);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.ok) router.push('/'); else setError(res.error ?? 'Could not sign in.');
  }

  return (
    <div className="px-5 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGOS.primaryCupQM} alt="" className="mb-3 h-16 w-16" />
          <h1 className="font-display text-3xl text-racing-700">Welcome back</h1>
          <p className="subhead mt-1 text-sm">Find your next great cup.</p>
        </div>

        <label className="mb-1 block font-mono text-xs text-coffee/60">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
          className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="you@example.com" />

        <label className="mb-1 block font-mono text-xs text-coffee/60">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="mb-2 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="••••••••" />

        <div className="mb-4 text-right">
          <Link href="/login" className="font-mono text-xs text-coffee/50 hover:text-racing-600">Forgot password?</Link>
        </div>

        {error && <p className="mb-3 font-mono text-xs text-red-700">{error}</p>}
        <Button className="w-full" size="lg" onClick={submit} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>

        <p className="mt-5 text-center font-mono text-sm text-coffee/60">
          New here? <Link href="/signup" className="text-racing-600">Create an account</Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="font-mono text-xs text-coffee/50 underline">Keep browsing as a guest</Link>
        </p>

        {isDemoMode && (
          <p className="mt-6 rounded-card bg-amber/10 px-4 py-3 text-center font-mono text-[0.7rem] text-amber-dark">
            Demo mode: any email and password will sign you in as the sample explorer.
          </p>
        )}
      </div>
    </div>
  );
}
