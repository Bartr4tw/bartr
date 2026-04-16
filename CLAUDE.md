# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mission

Bartr is a skill and hobby trading app built on the belief that every person has something worth teaching and something worth learning. In a world where AI is causing people to question the value of human skills, Bartr pushes back — celebrating what humans are uniquely capable of by connecting them with each other.

Tagline: **"Teach what you know. Learn what you don't."**

Works like a dating app for skills — users swipe through profiles of people offering skills or hobbies. When two people want what the other has, it's a match. No money changes hands. Launching NYC-only, starting with a small invite-only friend circle.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Infrastructure

- **Frontend:** React + Vite
- **Backend:** Supabase (PostgreSQL + auth)
- **Hosting:** Vercel — auto-deploys on push to `main`
- **Repo:** github.com/Bartr4tw/bartr
- **Live URL:** bartr-taupe.vercel.app
- **Supabase URL:** https://eukpabrbrvxvcnvpjyeh.supabase.co

## Environment Variables

`.env` is gitignored. Create locally with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

GitHub Actions secrets hold these for Vercel CI builds. Use the **legacy anon key** format — the new publishable key format causes silent insert timeouts on DB operations.

## File Structure

```
src/
  lib/supabase.js       # Supabase client singleton
  pages/
    Landing.jsx         # Public marketing/landing page
    BartrApp.jsx        # Main app UI (swipe interface, 3 tabs)
    Auth.jsx            # Login / signup
    Onboarding.jsx      # 3-step new user setup
    Chat.jsx            # Real-time 1:1 messaging between matched users
  assets/               # Images
  main.jsx              # Routing + auth state management
  index.css             # Intentionally empty (cleared to fix style conflicts)
public/
  favicon.svg
  icons.svg
vercel.json             # Rewrites all routes to /index.html for React Router SPA
.env.example            # Documents required env vars (no values)
```

## Routing & Auth Flow (`src/main.jsx`)

`main.jsx` contains the top-level `Root` component that owns all auth state (`session`, `loading`, `hasProfile`, `profile`).

- `/` → `Landing` (public, renders immediately — no auth gate)
- `/auth` → `Auth` (public)
- `/app` → `AppRoute` (protected):
  1. Loading → renders `null`
  2. No session → `Auth`
  3. Session, no profile row → `Onboarding`
  4. Session + profile → `BartrApp` (receives `profile` prop)
- `/chat/:userId` → `Chat` (self-contained auth check via `supabase.auth.getSession()`)

`checkProfile` fetches the full `profiles` row (`select("*")`) and stores it in `profile` state, which gets passed down to `BartrApp`. The `onComplete` callback in `Onboarding` calls `checkProfile` directly so the profile is fetched immediately after onboarding without a page reload.

## Database

**RLS is disabled on all tables.** Foreign key constraint on `profiles.id` was dropped to allow test inserts with fake UUIDs.

**Table: `profiles`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key (= auth user id) |
| `created_at` | timestamptz | |
| `username` | text | |
| `full_name` | text | |
| `location` | text | NYC neighborhood |
| `offering` | text | Single skill/hobby label |
| `offering_icon` | text | Emoji |
| `seeking` | text | Comma-separated skill labels |
| `bio` | text | |
| `avatar_url` | text | |

**Table: `swipes`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `swiper_id` | uuid | User who swiped |
| `swiped_id` | uuid | User who was swiped on |
| `direction` | text | `'left'` or `'right'` |
| `created_at` | timestamptz | |

Unique constraint on `(swiper_id, swiped_id)`.

**Table: `matches`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_a` | uuid | Lesser UUID of the pair (for dedup) |
| `user_b` | uuid | Greater UUID of the pair |
| `created_at` | timestamptz | |

Unique constraint on `(user_a, user_b)`. Created when mutual right swipes are detected.

**Table: `messages`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `sender_id` | uuid | |
| `receiver_id` | uuid | |
| `content` | text | |
| `created_at` | timestamptz | |

To enable live messaging, run once: `alter publication supabase_realtime add table messages;`

## Critical Workarounds

- **Supabase JS client insert timeout** — the JS client hangs silently on inserts. All writes use direct `fetch` to the Supabase REST API (`/rest/v1/profiles`) instead of `supabase.from(...).insert(...)`.
- **Legacy anon key required** — the new publishable key format causes silent timeouts on DB operations. Use the original anon key from the Supabase dashboard.
- **Supabase `getSession`** is wrapped in `.catch(() => {}).finally(() => setLoading(false))` — ensures the loading state always resolves even if Supabase errors (e.g., misconfigured env vars).
- **Multi-tab testing** — Supabase stores sessions in `localStorage`, shared across all tabs in the same browser. Use an incognito window to test a second user simultaneously.
- **`or` filter across different columns** — PostgREST's `?or=(user_a.eq.X,user_b.eq.X)` is unreliable. Always use two separate queries (one for each column) and merge results in JS.
- **`Array.isArray()` guard on all fetch responses** — Supabase returns an error object (not an array) on failed queries. Always check `Array.isArray(rows)` before using `.length` or `.map()` to avoid silent failures.
- **`keepalive: true` on swipe inserts** — ensures the swipe POST completes even if the user navigates away before the fetch resolves.

## Key Components

- **`Landing.jsx`** — Purely presentational. Scroll-triggered animations via `IntersectionObserver`. Waitlist email form is UI-only (not connected to a mailing list yet). "Try the app" links to `/app`.
- **`BartrApp.jsx`** — Three-tab app (Discover, Matches, Profile). Receives `profile` prop from `main.jsx`. Fetches real profiles from Supabase on mount, excluding the current user and anyone already swiped on or matched with. Swipe threshold: 100px desktop, 80px mobile. On right swipe, inserts to `swipes` table and checks for a mutual right swipe — if found, inserts to `matches` and shows the match overlay. Matches load from DB on mount so they persist across sessions. Profile tab has a Sign Out button. Desktop header shows Discover + Matches tabs on the left, Profile button top-right.
- **`Auth.jsx`** — Email + password auth. Signup collects full name. Email confirmation required before login. On successful login redirects via `window.location.href = "/app"`. Supabase Site URL is set to `bartr-taupe.vercel.app`.
- **`Onboarding.jsx`** — 3-step wizard: (1) name + NYC neighborhood + optional bio, (2) pick one offering from 24 options, (3) multi-select skills to learn (offering excluded). Saves via direct REST API fetch. NYC neighborhoods grouped by borough — Staten Island excluded intentionally.
- **`Chat.jsx`** — Full-screen messaging page at `/chat/:userId`. Fetches message history on mount using `sender_id=in.(X,Y)&receiver_id=in.(X,Y)` filter. Subscribes to Supabase Realtime for live incoming messages (requires `alter publication supabase_realtime add table messages` to be run once). Optimistic UI for sent messages. Auto-growing textarea, Enter to send. Back button navigates to `/app`.

## Design System

All styling is inline (no CSS modules, no Tailwind). `index.css` is intentionally empty.

- **Backgrounds:** `#080b14` (page), `#0f1623` (cards), `#111827` (panels)
- **Accent:** `#eab308` amber/gold for all interactive elements and highlights
- **Fonts:** `Cormorant Garamond` (serif display) + `DM Sans` (body) — loaded via Google Fonts `@import` inside each component's inline `<style>` block

## Immediate Next Tasks

1. **Merge `feature/chat` → `main`** — all swipe persistence, match detection, and chat work is on this branch
2. **Enable Supabase Realtime** — run `alter publication supabase_realtime add table messages;` in the SQL editor (one-time)
3. **Profile editing** — users can't update skills, bio, or neighborhood after onboarding
4. **Polish chat navigation** — back button uses `window.location.href` (full reload); switch to React Router `navigate()` for instant transition
5. **Invite-only system** — controlled signups for the NYC friend-circle launch
6. **Custom domain** — set up `bartr.app` or `bartr.co` before sharing with real users

## Future Roadmap

- Connect waitlist email to Mailchimp or Beehiiv
- Profile editing screen
- Neighborhood-weighted matching (show nearby users first)
- React Native conversion for App Store
- Video proof of skill on profiles
- Safety features (reporting, session check-ins)
- Invite-only system for controlled early growth
- Custom domain (bartr.app or bartr.co)
