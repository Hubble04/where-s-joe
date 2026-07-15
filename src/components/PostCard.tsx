'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import { useStore } from '@/lib/store';
import { cn, timeAgo } from '@/lib/utils';
import { ImageWithFallback } from './ImageWithFallback';

export function PostCard({ post, onNeedAuth }: { post: Post; onNeedAuth: () => void }) {
  const { me, getUser, getCafe, isLiked, likeCount, commentsFor, toggleLike, addComment, hasSave, toggleSave } = useStore();
  const author = getUser(post.userId);
  const cafe = post.cafeId ? getCafe(post.cafeId) : undefined;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const liked = isLiked(post.id);
  const comments = commentsFor(post.id);

  const guard = (fn: () => void) => () => (me ? fn() : onNeedAuth());

  return (
    <article className="overflow-hidden rounded-card bg-ivory shadow-card animate-fade-up">
      <div className="flex items-center gap-3 px-4 py-3">
        <ImageWithFallback src={author.profilePhotoUrl} alt={author.name} seed={author.name} className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm text-racing-700">@{author.username}</p>
          {cafe && (
            <Link href={`/cafe/${cafe.id}`} className="flex items-center gap-1 truncate font-mono text-xs text-amber-dark">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-amber-dark" aria-hidden><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
              {cafe.name}
            </Link>
          )}
        </div>
        <span className="shrink-0 font-mono text-xs text-coffee/40">{timeAgo(post.createdAt)}</span>
      </div>

      {post.photos.length > 0 && (
        <div className="relative">
          <ImageWithFallback src={post.photos[photoIdx]} alt="" seed={post.id} className="aspect-square w-full" />
          {post.photos.length > 1 && (
            <>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {post.photos.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === photoIdx ? 'w-4 bg-ivory' : 'w-1.5 bg-ivory/60')} />)}
              </div>
              {photoIdx > 0 && <button onClick={() => setPhotoIdx((i) => i - 1)} className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-racing-900/40 text-ivory">‹</button>}
              {photoIdx < post.photos.length - 1 && <button onClick={() => setPhotoIdx((i) => i + 1)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-racing-900/40 text-ivory">›</button>}
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={guard(() => toggleLike(post.id))} className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className={cn('h-6 w-6', liked ? 'fill-amber stroke-amber' : 'fill-none stroke-coffee/70')} strokeWidth={1.6}>
            <path d="M12 21l-1.5-1.4C5.4 15 2 11.9 2 8.2 2 5.5 4.1 3.5 6.8 3.5c1.5 0 3 .7 3.9 1.9.9-1.2 2.4-1.9 3.9-1.9 2.7 0 4.8 2 4.8 4.7 0 3.7-3.4 6.8-8.5 11.4z" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-sm text-coffee/70">{likeCount(post.id)}</span>
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-coffee/70" strokeWidth={1.6}><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" strokeLinejoin="round" /></svg>
          <span className="font-mono text-sm text-coffee/70">{comments.length}</span>
        </button>
        {post.drinkTag && <span className="ml-auto rounded-pill bg-parchment px-2.5 py-1 font-mono text-[0.7rem] text-coffee/80">☕ {post.drinkTag}</span>}
      </div>

      <div className="px-4 pb-1 pt-2">
        <p className="text-sm text-coffee/90"><span className="text-racing-700">@{author.username}</span> {post.caption}</p>
      </div>

      {cafe && (
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={guard(() => toggleSave(cafe.id, 'want_to_go'))}
            className={cn('inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-xs', hasSave(cafe.id, 'want_to_go') ? 'border-navy bg-navy/10 text-navy' : 'border-racing-100 text-coffee/70')}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={1.6}><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" strokeLinejoin="round" /></svg>
            {hasSave(cafe.id, 'want_to_go') ? 'On your Want To Go' : 'Save to Want To Go'}
          </button>
        </div>
      )}

      {open && (
        <div className="border-t border-racing-100 px-4 py-3">
          <div className="space-y-2">
            {comments.map((c) => {
              const u = getUser(c.userId);
              return (
                <p key={c.id} className="text-sm text-coffee/85">
                  <span className="text-racing-700">@{u.username}</span> {c.content}
                  <span className="ml-2 font-mono text-[0.65rem] text-coffee/40">{timeAgo(c.createdAt)}</span>
                </p>
              );
            })}
            {comments.length === 0 && <p className="text-sm text-coffee/50">No comments yet.</p>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && me) { addComment(post.id, text); setText(''); } }}
              placeholder={me ? 'Add a comment…' : 'Log in to comment'}
              disabled={!me}
              className="flex-1 rounded-pill border border-racing-100 bg-ivory px-3 py-2 font-mono text-sm placeholder:text-coffee/40 focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={() => { if (me) { addComment(post.id, text); setText(''); } else onNeedAuth(); }}
              disabled={!!me && !text.trim()}
              className="rounded-pill bg-racing-600 px-3 py-2 font-mono text-xs text-ivory disabled:opacity-40"
            >Post</button>
          </div>
        </div>
      )}
    </article>
  );
}
