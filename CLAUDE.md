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

`checkProfile` fetches the full `profiles` row (`select("*")`) and stores it in `profile` state, which gets passed down to `BartrApp`. The `onComplete` callback in `Onboarding` calls `checkProfile` directly so the profile is fetched immediately after onboarding without a page reload.

## Database

**Table: `profiles`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. Foreign key constraint dropped to allow test data with fake UUIDs |
| `created_at` | timestamptz | |
| `username` | text | |
| `full_name` | text | |
| `location` | text | NYC neighborhood |
| `offering` | text | Single skill/hobby label |
| `offering_icon` | text | Emoji |
| `seeking` | text | Comma-separated skill labels |
| `bio` | text | |
| `avatar_url` | text | |

**RLS is disabled.** Foreign key constraint on `id` was dropped to allow test inserts with fake UUIDs.

## Critical Workarounds

- **Supabase JS client insert timeout** — the JS client hangs silently on inserts. All writes use direct `fetch` to the Supabase REST API (`/rest/v1/profiles`) instead of `supabase.from(...).insert(...)`.
- **Legacy anon key required** — the new publishable key format causes silent timeouts on DB operations. Use the original anon key from the Supabase dashboard.
- **Supabase `getSession`** is wrapped in `.catch(() => {}).finally(() => setLoading(false))` — ensures the loading state always resolves even if Supabase errors (e.g., misconfigured env vars).
- **Multi-tab testing** — Supabase stores sessions in `localStorage`, shared across all tabs in the same browser. Use an incognito window to test a second user simultaneously.

## Key Components

- **`Landing.jsx`** — Purely presentational. Scroll-triggered animations via `IntersectionObserver`. Waitlist email form is UI-only (not connected to a mailing list yet). "Try the app" links to `/app`.
- **`BartrApp.jsx`** — Three-tab app (Discover, Matches, Profile). Receives `profile` prop from `main.jsx` and builds `YOUR_PROFILE` from it. The swipe card stack currently shows **hardcoded mock `PROFILES`** — fetching real profiles from Supabase is the immediate next task. Swipe threshold: 100px desktop, 80px mobile.
- **`Auth.jsx`** — Email + password auth. Signup collects full name. Email confirmation required before login. On successful login redirects via `window.location.href = "/app"`. Supabase Site URL is set to `bartr-taupe.vercel.app`.
- **`Onboarding.jsx`** — 3-step wizard: (1) name + NYC neighborhood + optional bio, (2) pick one offering from 24 options, (3) multi-select skills to learn (offering excluded). Saves via direct REST API fetch. NYC neighborhoods grouped by borough — Staten Island excluded intentionally.

## Design System

All styling is inline (no CSS modules, no Tailwind). `index.css` is intentionally empty.

- **Backgrounds:** `#080b14` (page), `#0f1623` (cards), `#111827` (panels)
- **Accent:** `#eab308` amber/gold for all interactive elements and highlights
- **Fonts:** `Cormorant Garamond` (serif display) + `DM Sans` (body) — loaded via Google Fonts `@import` inside each component's inline `<style>` block

## Immediate Next Task

Update `BartrApp.jsx` to fetch real profiles from Supabase and replace the hardcoded `PROFILES` array. The fetch should exclude the currently logged-in user's own profile. Display the same swipe card UI with real data.

## Future Roadmap

- Connect waitlist email to Mailchimp or Beehiiv
- Messaging between matches
- Profile editing screen
- Matching algorithm weighted by neighborhood proximity
- React Native conversion for App Store
- Video proof of skill on profiles
- Safety features (reporting, session check-ins)
- Invite-only system for controlled early growth
- Custom domain (bartr.app or bartr.co)
