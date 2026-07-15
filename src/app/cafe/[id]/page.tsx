'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { TAG_CATEGORY } from '@/lib/brand';
import { groupTags, priceLabel, openLabel } from '@/lib/utils';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Rating, VerifiedBadge } from '@/components/Badge';
import { SaveActions } from '@/components/SaveActions';
import { MapView } from '@/components/MapView';
import { PostCard } from '@/components/PostCard';
import { SectionTitle, SignInPrompt, Modal } from '@/components/ui';

export default function CafePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getCafe, postsForCafe, savesForCafe } = useStore();
  const [authPrompt, setAuthPrompt] = useState(false);
  const cafe = getCafe(id);

  if (!cafe) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-2xl text-racing-700">Café not found</p>
        <Link href="/" className="mt-3 inline-block font-mono text-sm text-racing-600 underline">Back to Explore</Link>
      </div>
    );
  }

  const grouped = groupTags(cafe.tags, TAG_CATEGORY);
  const posts = postsForCafe(cafe.id);
  const mySip = savesForCafe(cafe.id).find((s) => s.saveType === 'sipped_there');

  return (
    <div className="pb-6">
      <div className="relative">
        <ImageWithFallback src={cafe.coverPhotoUrl} alt={cafe.name} seed={cafe.name} className="aspect-[16/11] w-full" />
        <button onClick={() => router.back()} aria-label="Back"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 shadow-card">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-racing-700" strokeWidth={1.8}><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="px-4">
        <div className="-mt-6 rounded-card bg-ivory p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              {cafe.verifiedByJoe && <div className="mb-1"><VerifiedBadge /></div>}
              <h1 className="font-display text-3xl leading-tight text-racing-700">{cafe.name}</h1>
              <p className="mt-1 font-mono text-xs text-coffee/60">{cafe.neighborhood} · {cafe.city}, {cafe.state} · {priceLabel(cafe.priceTier)}</p>
            </div>
            <Rating value={cafe.rating} count={cafe.reviewCount} />
          </div>
          <p className="mt-2 font-mono text-xs text-racing-600">{openLabel(cafe)}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {cafe.website && <ContactPill href={cafe.website} label="Website" icon="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />}
            {cafe.instagram && <ContactPill href={`https://instagram.com/${cafe.instagram.replace('@', '')}`} label={cafe.instagram} icon="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M17 7h0" />}
            {cafe.phone && <ContactPill href={`tel:${cafe.phone}`} label={cafe.phone} icon="M4 5a2 2 0 0 1 2-2h2l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 5z" />}
          </div>
          {cafe.address && <p className="mt-2 font-mono text-xs text-coffee/55">{cafe.address}</p>}
        </div>

        <div className="mt-4">
          <SaveActions cafe={cafe} onNeedAuth={() => setAuthPrompt(true)} />
        </div>

        <section className="mt-6">
          <SectionTitle eyebrow="About" title="The story" />
          <p className="text-sm leading-relaxed text-coffee/85">{cafe.description}</p>
        </section>

        <section className="mt-6">
          <SectionTitle eyebrow="On the menu" title="Popular drinks" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cafe.signatureDrink && (
              <div className="flex w-40 shrink-0 flex-col rounded-card border border-amber/30 bg-amber/5 p-3">
                <span className="font-heading text-base text-racing-700">{cafe.signatureDrink}</span>
                <span className="mt-1 font-mono text-[0.65rem] text-amber-dark">Signature</span>
              </div>
            )}
            {['House Latte', 'Cold Brew', 'Pour Over'].map((d) => (
              <div key={d} className="flex w-40 shrink-0 flex-col rounded-card border border-racing-100 bg-ivory p-3">
                <span className="font-heading text-base text-racing-700">{d}</span>
                <span className="mt-1 font-mono text-[0.65rem] text-coffee/40">Menu coming soon</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <SectionTitle eyebrow="Good to know" title="Tags" />
          <div className="space-y-3">
            {grouped.map((g) => (
              <div key={g.category}>
                <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-eyebrow text-coffee/45">{g.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.tags.map((t) => <span key={t} className="rounded-pill bg-parchment px-2.5 py-1 font-mono text-[0.7rem] text-coffee/80">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {cafe.gallery.length > 0 && (
          <section className="mt-6">
            <SectionTitle eyebrow="Through the lens" title="Gallery" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {cafe.gallery.map((src, i) => (
                <ImageWithFallback key={i} src={src} alt="" seed={cafe.name + i} className="h-40 w-32 shrink-0 rounded-card" />
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <SectionTitle eyebrow="From the community" title="Recent posts" />
          {posts.length === 0 ? (
            <p className="rounded-card bg-parchment px-4 py-6 text-center font-mono text-sm text-coffee/50">No posts yet — be the first to share a visit.</p>
          ) : (
            <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} onNeedAuth={() => setAuthPrompt(true)} />)}</div>
          )}
        </section>

        <section className="mt-6">
          <SectionTitle eyebrow="Notes" title="Your visit" />
          {mySip ? (
            <div className="rounded-card border border-amber/30 bg-amber/5 p-4">
              <p className="font-mono text-xs text-coffee/70">
                {mySip.orderedDrink ? <>You ordered <span className="text-racing-700">{mySip.orderedDrink}</span>{mySip.milkType ? ` with ${mySip.milkType} milk` : ''}. </> : 'You sipped here. '}
                {mySip.recommend === true && <span className="text-racing-600">You&rsquo;d recommend this Joe.</span>}
                {mySip.recommend === false && <span className="text-amber-dark">Not your cup of tea.</span>}
              </p>
              {mySip.note && <p className="mt-2 text-sm italic text-coffee/80">&ldquo;{mySip.note}&rdquo;</p>}
            </div>
          ) : (
            <p className="rounded-card bg-parchment px-4 py-6 text-center font-mono text-sm text-coffee/50">
              Tap <span className="text-amber-dark">Sipped There</span> after your visit to leave a note.
            </p>
          )}
        </section>

        <section className="mt-6">
          <SectionTitle eyebrow="Find it" title="Location" />
          <MapView cafes={[cafe]} className="h-56 w-full" />
        </section>
      </div>

      <Modal open={authPrompt} onClose={() => setAuthPrompt(false)} title="Join Where's Joe?">
        <SignInPrompt message="Log in to save cafés, stamp your passport, and post to the community." />
      </Modal>
    </div>
  );
}

function ContactPill({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-pill border border-racing-100 px-3 py-1.5 font-mono text-xs text-racing-700">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={1.6}><path d={icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </a>
  );
}
