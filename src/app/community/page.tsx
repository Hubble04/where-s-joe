'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FEED_MODES, DRINK_TYPES, VISIBILITY } from '@/lib/brand';
import type { Visibility } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Chip, EmptyState, Modal, SignInPrompt } from '@/components/ui';
import { Button } from '@/components/Button';

export default function CommunityPage() {
  const { me, feedPosts } = useStore();
  const [mode, setMode] = useState<string>('Global');
  const [composing, setComposing] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  const posts = feedPosts(mode);

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">The coffee community</p>
          <h1 className="font-display text-3xl text-racing-700">Community</h1>
        </div>
        <button
          onClick={() => (me ? setComposing(true) : setAuthPrompt(true))}
          className="flex items-center gap-1.5 rounded-pill bg-racing-600 px-4 py-2 font-mono text-sm text-ivory"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Post
        </button>
      </div>

      <div className="rail mb-4">
        {FEED_MODES.map((m) => <Chip key={m} label={m} active={mode === m} onClick={() => setMode(m)} />)}
      </div>

      {mode === 'Following' && !me ? (
        <SignInPrompt message="Log in to see posts from people you follow." />
      ) : posts.length === 0 ? (
        <EmptyState title="Nothing here yet" body={mode === 'Following' ? 'Follow some coffee people to fill this feed.' : 'Be the first to share a cup.'} action={<Button onClick={() => (me ? setComposing(true) : setAuthPrompt(true))}>Create a post</Button>} />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => <PostCard key={p.id} post={p} onNeedAuth={() => setAuthPrompt(true)} />)}
        </div>
      )}

      <Link href="/suggest" className="mt-6 flex items-center gap-3 rounded-card border border-dashed border-racing-300 bg-ivory px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-racing-600/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-racing-600" strokeWidth={1.6}><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" strokeLinejoin="round" /><path d="M12 7v4M10 9h4" strokeLinecap="round" /></svg>
        </span>
        <span className="flex-1">
          <span className="block font-heading text-base text-racing-700">Suggest a new café</span>
          <span className="block font-mono text-xs text-coffee/55">Know a spot we&rsquo;re missing? Help grow the map.</span>
        </span>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-coffee/40" strokeWidth={1.6}><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      {composing && <ComposeModal onClose={() => setComposing(false)} />}
      <Modal open={authPrompt} onClose={() => setAuthPrompt(false)} title="Join the community">
        <SignInPrompt message="Log in to post, like, comment, and follow." />
      </Modal>
    </div>
  );
}

function ComposeModal({ onClose }: { onClose: () => void }) {
  const { cafes, createPost } = useStore();
  const [caption, setCaption] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [drink, setDrink] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [photos, setPhotos] = useState<string[]>([]);

  const visMap: Record<string, Visibility> = { 'Public': 'public', 'Followers only': 'followers', 'Private': 'private' };

  function submit() {
    if (!caption.trim() && photos.length === 0) return;
    createPost({ caption: caption.trim(), cafeId: cafeId || null, drinkTag: drink || null, visibility, photos });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="New post">
      <PhotoUpload value={photos} onChange={setPhotos} />
      <textarea
        value={caption} onChange={(e) => setCaption(e.target.value)} rows={3}
        placeholder="Share your cup…"
        className="mt-3 w-full resize-none rounded-xl border border-racing-100 bg-ivory px-3 py-2.5 font-mono text-sm placeholder:text-coffee/40 focus:outline-none focus:ring-2 focus:ring-racing-600"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block font-mono text-xs text-coffee/60">Tag a café</label>
          <select value={cafeId} onChange={(e) => setCafeId(e.target.value)} className="w-full rounded-xl border border-racing-100 bg-ivory px-2 py-2 font-mono text-xs">
            <option value="">None</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs text-coffee/60">Tag a drink</label>
          <select value={drink} onChange={(e) => setDrink(e.target.value)} className="w-full rounded-xl border border-racing-100 bg-ivory px-2 py-2 font-mono text-xs">
            <option value="">None</option>
            {DRINK_TYPES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block font-mono text-xs text-coffee/60">Who can see this?</label>
        <div className="flex gap-2">
          {VISIBILITY.map((v) => (
            <button key={v} onClick={() => setVisibility(visMap[v])}
              className={`flex-1 rounded-pill border px-2 py-1.5 font-mono text-[0.7rem] ${visibility === visMap[v] ? 'border-racing-600 bg-racing-600 text-ivory' : 'border-racing-100 text-coffee/70'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={submit} disabled={!caption.trim() && photos.length === 0}>Share post</Button>
      </div>
    </Modal>
  );
}
