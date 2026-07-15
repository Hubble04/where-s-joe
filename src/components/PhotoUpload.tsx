'use client';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { isDemoMode } from '@/lib/env';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads photos. In demo mode (no Supabase) it produces local object URLs so
 * the flow works visually. With Supabase configured you'd swap the upload step
 * for a storage upload — the component contract stays the same.
 */
export function PhotoUpload({
  value, onChange, multiple = true, max = 6, label = 'Add photos',
}: { value: string[]; onChange: (urls: string[]) => void; multiple?: boolean; max?: number; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const picked = Array.from(files);
    for (const f of picked) {
      if (!ACCEPTED.includes(f.type)) { setError('Only JPG, PNG, or WebP images are allowed.'); return; }
      if (f.size > MAX_BYTES) { setError('Each image must be under 5 MB.'); return; }
    }
    setBusy(true);
    const urls = await Promise.all(picked.map((f) => new Promise<string>((res) => {
      const url = URL.createObjectURL(f);
      setTimeout(() => res(url), 250);
    })));
    setBusy(false);
    const next = multiple ? [...value, ...urls].slice(0, max) : urls.slice(0, 1);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-racing-900/70 text-ivory"
              aria-label="Remove photo"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth={2.4}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
        {(multiple ? value.length < max : value.length === 0) && (
          <button
            type="button" onClick={() => input.current?.click()} disabled={busy}
            className={cn('flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-racing-300 text-coffee/60', busy && 'opacity-60')}
          >
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-racing-300 border-t-racing-600" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={1.6}><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                <span className="font-mono text-[0.6rem]">{label}</span>
              </>
            )}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPTED.join(',')} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
      {error && <p className="mt-2 font-mono text-xs text-red-700">{error}</p>}
      {isDemoMode && value.length > 0 && (
        <p className="mt-2 font-mono text-[0.65rem] text-coffee/50">Demo mode: photos preview locally and aren&rsquo;t uploaded to a server.</p>
      )}
    </div>
  );
}
