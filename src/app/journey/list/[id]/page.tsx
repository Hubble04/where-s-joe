'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CafeCard } from '@/components/CafeCard';
import { MapView } from '@/components/MapView';
import { EmptyState, Modal, SignInPrompt } from '@/components/ui';
import { Button } from '@/components/Button';

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, lists, getCafe, cafes, addToList, removeFromList } = useStore();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [adding, setAdding] = useState(false);

  if (!me) {
    return <div className="px-4 py-10"><SignInPrompt message="Log in to view your lists." /></div>;
  }

  const list = lists.find((l) => l.id === id && l.userId === me.id);
  if (!list) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl text-racing-700">List not found</p>
        <Link href="/journey" className="mt-3 inline-block font-mono text-sm text-racing-600 underline">Back to Journey</Link>
      </div>
    );
  }

  const listCafes = (list.cafeIds || []).map(getCafe).filter(Boolean);
  const notInList = cafes.filter((c) => !(list.cafeIds || []).includes(c.id));

  return (
    <div className="px-4 py-4">
      <button onClick={() => router.back()} className="mb-3 flex items-center gap-1 font-mono text-xs text-coffee/60">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.8}><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Journey
      </button>

      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Custom list</p>
          <h1 className="font-display text-3xl text-racing-700">{list.name}</h1>
          {list.description && <p className="mt-1 font-mono text-xs text-coffee/55">{list.description}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono text-xs text-coffee/60">{listCafes.length} café{listCafes.length === 1 ? '' : 's'}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAdding(true)}>+ Add café</Button>
          <div className="flex rounded-pill border border-racing-100 p-0.5">
            {(['list', 'map'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-pill px-3 py-1 font-mono text-xs capitalize ${view === v ? 'bg-racing-600 text-ivory' : 'text-coffee/60'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {listCafes.length === 0 ? (
          <EmptyState title="Empty list" body="Add cafés to start building this collection." action={<Button onClick={() => setAdding(true)}>Add a café</Button>} />
        ) : view === 'map' ? (
          <MapView cafes={listCafes as any} className="h-[60vh] w-full" />
        ) : (
          <div className="space-y-3">
            {listCafes.map((c) => (
              <div key={c!.id} className="relative">
                <CafeCard cafe={c!} variant="compact" />
                <button
                  onClick={() => removeFromList(list.id, c!.id)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-ivory shadow-card"
                  aria-label="Remove from list"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-red-700" strokeWidth={1.8}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a café">
        {notInList.length === 0 ? (
          <p className="text-sm text-coffee/60">Every café is already on this list.</p>
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {notInList.map((c) => (
              <button
                key={c.id} onClick={() => { addToList(list.id, c.id); }}
                className="flex w-full items-center gap-3 rounded-card border border-racing-100 p-2 text-left hover:bg-parchment"
              >
                <span className="flex-1 truncate font-display text-lg text-racing-700">{c.name}</span>
                <span className="font-mono text-xs text-racing-600">Add</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-4"><Button className="w-full" onClick={() => setAdding(false)}>Done</Button></div>
      </Modal>
    </div>
  );
}
