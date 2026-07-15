'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { isDemoMode } from '@/lib/env';
import { LOGOS } from '@/lib/brand';
import { Button } from '@/components/Button';

export default function SignupPage() {
  const { signUp } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !username.trim() || !email.trim()) { setError('Please fill in name, username, and email.'); return; }
    setBusy(true);
    const res = await signUp({ name: name.trim(), username: username.trim().replace(/^@/, ''), email: email.trim(), password });
    setBusy(false);
    if (res.ok) router.push('/'); else setError(res.error ?? 'Could not create account.');
  }

  return (
    <div className="px-5 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGOS.primaryCupQM} alt="" className="mb-3 h-16 w-16" />
          <h1 className="font-display text-3xl text-racing-700">Join Where&rsquo;s Joe?</h1>
          <p className="subhead mt-1 text-sm">Start your Coffee Passport.</p>
        </div>

        <label className="mb-1 block font-mono text-xs text-coffee/60">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="Your name" />

        <label className="mb-1 block font-mono text-xs text-coffee/60">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="@handle" />

        <label className="mb-1 block font-mono text-xs text-coffee/60">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="you@example.com" />

        <label className="mb-1 block font-mono text-xs text-coffee/60">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" onKeyDown={(e) => e.key === 'Enter' && submit()} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-racing-600" placeholder="Create a password" />

        {error && <p className="mb-3 font-mono text-xs text-red-700">{error}</p>}
        <Button className="w-full" size="lg" onClick={submit} disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>

        <p className="mt-5 text-center font-mono text-sm text-coffee/60">
          Already have an account? <Link href="/login" className="text-racing-600">Log in</Link>
        </p>
        {isDemoMode && (
          <p className="mt-6 rounded-card bg-amber/10 px-4 py-3 text-center font-mono text-[0.7rem] text-amber-dark">
            Demo mode: your account lives in this browser. Add Supabase keys for real accounts.
          </p>
        )}
      </div>
    </div>
  );
}
