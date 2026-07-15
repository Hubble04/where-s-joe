'use client';
import { useState } from 'react';
import type { Cafe } from '@/lib/types';
import { useStore } from '@/lib/store';
import { DRINK_TYPES, MILK_TYPES } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { Modal } from './ui';
import { Button } from './Button';

function ActionButton({ active, onClick, activeColor, icon, label }: {
  active: boolean; onClick: () => void; activeColor: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-card border px-2 py-2.5 font-mono text-[0.7rem] transition-colors',
        active ? activeColor : 'border-racing-100 bg-ivory text-coffee/70 hover:border-racing-300',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function SaveActions({ cafe, onNeedAuth }: { cafe: Cafe; onNeedAuth: () => void }) {
  const { me, hasSave, toggleSave, sipCafe } = useStore();
  const [modal, setModal] = useState(false);

  const wtg = hasSave(cafe.id, 'want_to_go');
  const sipped = hasSave(cafe.id, 'sipped_there');
  const fav = hasSave(cafe.id, 'favorite');

  const guard = (fn: () => void) => () => (me ? fn() : onNeedAuth());

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) { try { await navigator.share({ title: cafe.name, url }); } catch { /* cancelled */ } }
    else { try { await navigator.clipboard.writeText(url); } catch { /* noop */ } }
  }

  return (
    <>
      <div className="flex gap-2">
        <ActionButton
          active={wtg} activeColor="border-navy bg-navy/10 text-navy" onClick={guard(() => toggleSave(cafe.id, 'want_to_go'))}
          label="Want To Go"
          icon={<svg viewBox="0 0 24 24" className={cn('h-5 w-5 fill-none', wtg ? 'stroke-navy' : 'stroke-coffee/60')} strokeWidth={1.6}><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" strokeLinejoin="round" /></svg>}
        />
        <ActionButton
          active={sipped} activeColor="border-amber bg-amber/10 text-amber-dark" onClick={guard(() => (sipped ? toggleSave(cafe.id, 'sipped_there') : setModal(true)))}
          label={sipped ? 'Sipped' : 'Sipped There'}
          icon={<svg viewBox="0 0 24 24" className={cn('h-5 w-5 fill-none', sipped ? 'stroke-amber-dark' : 'stroke-coffee/60')} strokeWidth={1.6}><path d="M4 8h13a3 3 0 0 1 0 6h-1M4 8v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3M8 3v2M11 3v2" strokeLinecap="round" /></svg>}
        />
        <ActionButton
          active={fav} activeColor="border-gold bg-gold/10 text-gold" onClick={guard(() => toggleSave(cafe.id, 'favorite'))}
          label="Favorite"
          icon={<svg viewBox="0 0 24 24" className={cn('h-5 w-5', fav ? 'fill-gold stroke-gold' : 'fill-none stroke-coffee/60')} strokeWidth={1.6}><path d="M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.2 2 5.5 4.1 3.5 6.8 3.5c1.5 0 3 .7 3.9 1.9.9-1.2 2.4-1.9 3.9-1.9 2.7 0 4.8 2 4.8 4.7 0 3.7-3.4 6.8-8.5 11.4z" strokeLinejoin="round" /></svg>}
        />
        <ActionButton
          active={false} activeColor="" onClick={share} label="Share"
          icon={<svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-coffee/60" strokeWidth={1.6}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>}
        />
      </div>
      <SippedModal cafe={cafe} open={modal} onClose={() => setModal(false)} onSubmit={(d) => { sipCafe(cafe.id, d); setModal(false); }} />
    </>
  );
}

export function SippedModal({ cafe, open, onClose, onSubmit }: {
  cafe: Cafe; open: boolean; onClose: () => void;
  onSubmit: (d: { orderedDrink?: string; milkType?: string; recommend?: boolean | null; note?: string }) => void;
}) {
  const [drink, setDrink] = useState('');
  const [milk, setMilk] = useState('');
  const [rec, setRec] = useState<boolean | null>(null);

  return (
    <Modal open={open} onClose={onClose} title={`You sipped at ${cafe.name}`}>
      <p className="mb-4 text-sm text-coffee/70">Add a little detail if you like — all optional.</p>
      <label className="mb-1 block font-mono text-xs text-coffee/60">What did you order?</label>
      <select value={drink} onChange={(e) => setDrink(e.target.value)} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm">
        <option value="">Select a drink…</option>
        {DRINK_TYPES.map((d) => <option key={d}>{d}</option>)}
      </select>
      <label className="mb-1 block font-mono text-xs text-coffee/60">Milk type?</label>
      <select value={milk} onChange={(e) => setMilk(e.target.value)} className="mb-4 w-full rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm">
        <option value="">Select milk…</option>
        {MILK_TYPES.map((m) => <option key={m}>{m}</option>)}
      </select>
      <label className="mb-2 block font-mono text-xs text-coffee/60">Would you recommend this Joe?</label>
      <div className="mb-5 flex gap-2">
        <button onClick={() => setRec(true)} className={cn('flex-1 rounded-pill border px-3 py-2 font-mono text-xs', rec === true ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 text-coffee/70')}>I&rsquo;d recommend this Joe</button>
        <button onClick={() => setRec(false)} className={cn('flex-1 rounded-pill border px-3 py-2 font-mono text-xs', rec === false ? 'border-amber bg-amber text-ivory' : 'border-racing-100 text-coffee/70')}>Not my cup of tea</button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => onSubmit({})}>Skip</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSubmit({ orderedDrink: drink || undefined, milkType: milk || undefined, recommend: rec })}>Save stamp</Button>
      </div>
    </Modal>
  );
}
