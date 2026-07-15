# Where's Joe? ☕

A mobile-first community platform for discovering independent coffee shops in Austin, TX — think *Instagram + Google Maps + a Coffee Passport*. Explore cafés, share your visits, stamp your passport, and help grow the map.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**, with a **Mapbox** map. The whole app is designed for **graceful degradation**: it runs fully on bundled mock data with **zero configuration**, and lights up real accounts, data, and a live map as you add keys.

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — with no keys at all, the app runs in **demo mode**: seven real Austin cafés, a working Coffee Passport, community feed, posting, saving, following, and café suggestions, all persisted in your browser's `localStorage`. A "Demo" badge appears in the header so testers know what mode they're in.

> Requires Node.js 18.17+ (Node 20+ recommended).

---

## Modes at a glance

| Capability | No keys (demo) | + Mapbox token | + Supabase |
|---|---|---|---|
| Browse cafés, search, filters | ✅ mock data | ✅ | ✅ live data |
| Map | 🗺️ styled static map w/ pins | ✅ interactive Mapbox | ✅ |
| Sign up / log in | ✅ simulated (localStorage) | — | ✅ real auth |
| Post, like, comment, follow, save | ✅ localStorage | — | ✅ persisted |
| Photo uploads | 🖼️ local preview | — | ✅ Supabase Storage |
| Admin moderation | ✅ (sign in as Joe) | — | ✅ role-gated |

Your Mapbox token is already wired into `.env.local`, so the **live map works out of the box** on your machine. Add Supabase keys whenever you're ready for real accounts and shared data.

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in what you have (a `.env.local` with your Mapbox token is already included):

```bash
# Supabase — Settings → API in your Supabase project. Blank = demo mode.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Mapbox — a public pk. token. Safe in the browser; add URL restrictions for prod.
NEXT_PUBLIC_MAPBOX_TOKEN=pk....

# Optional — used for share links / PWA.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is gitignored and will **not** be committed.

---

## Setting up Supabase (optional)

You only need this when you want real accounts and persistent, shared data.

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard, open the **SQL Editor** and click **New query**.
3. Open `supabase/schema.sql` in this repo, **copy its entire contents**, paste them into the editor, and run it (⌘/Ctrl + Enter). This creates the tables, row-level-security policies, and triggers.

   > Paste the **contents** of the file — not the filename. The SQL Editor runs SQL, not file paths.

4. Repeat with `supabase/seed.sql` to load the starter café catalogue (7 cafés + tags). Run it **after** `schema.sql`.
5. In **Settings → API**, copy the **Project URL** and the **anon public** key into `.env.local`.
6. Restart `npm run dev`. The "Demo" badge disappears and the app now reads and writes real data.

### Making yourself an admin

The admin dashboard at `/admin` is gated to profiles with `role = 'admin'`.

- **Demo mode:** sign in with the email `joe@wheresjoe.app` to enter as Joe, the seeded admin.
- **With Supabase:** sign up normally, then in the Supabase **Table Editor** open the `profiles` table, find your row, and set `role` to `admin`.

---

## Project structure

```
src/
  app/                 # App Router pages
    page.tsx           # Explore (discovery: search, filters, map/list)
    cafe/[id]/         # Café profile
    community/         # Social feed + create post
    suggest/           # Suggest-a-café form (moderation queue)
    journey/           # Coffee Passport (Want To Go / Sipped / Favorites / Lists)
      list/[id]/       # Custom list detail
    profile/           # Your profile, posts, saves, settings
    admin/             # Moderation dashboard (role-gated)
    login/  signup/    # Auth
  components/          # UI: CafeCard, PostCard, MapView, PassportStamp, SaveActions…
  lib/
    store.tsx          # Client data store (demo engine + localStorage persistence)
    types.ts           # Domain types (mirror the DB schema)
    mockData.ts        # Seven Austin cafés + sample users/posts for demo mode
    brand.ts           # Logos, palette, tag taxonomy, dropdown option lists
    env.ts             # Reads env vars; exposes hasSupabase / hasMapbox / isDemoMode
    utils.ts           # Formatting, distance, open-now, tag grouping helpers
    supabase/          # Browser + server Supabase clients (used when keys present)
supabase/
  schema.sql           # Tables, RLS policies, triggers
  seed.sql             # Starter café catalogue
public/                # PWA manifest, service worker, icons, fonts, logos
```

## How demo mode works

`src/lib/store.tsx` is a React context that seeds from `mockData.ts` and persists all user-generated changes (posts, likes, follows, saves, lists, suggestions, profile edits) to `localStorage` under the `wheres-joe:v2` key. Every feature in the acceptance checklist works against this store, so the app is fully interactive with no backend. When Supabase keys are present, `env.ts` flips `isDemoMode` off and the Supabase clients in `lib/supabase/` become the source of truth.

To reset demo data, clear the site's `localStorage` in your browser dev tools.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Vercel detects Next.js automatically.
3. Add your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SITE_URL`) in the project settings.
4. Deploy. Before going live, add URL restrictions to your Mapbox token in the Mapbox dashboard so only your domain can use it.

---

## Roadmap (intentionally left open)

The architecture leaves room for, but does not yet implement: the **Bean** AI coffee guide (there's an inert placeholder card), **Joe Points** rewards, café-owner business dashboards, and menu/ordering. These are deliberately out of scope for this build.

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```
