# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**Bartr** is a skill-trading app (think Tinder for skill exchange — no money, just humans teaching humans). Launching in New York City first.

### Routing & Auth Flow (`src/main.jsx`)

`main.jsx` is the entry point and contains the top-level `Root` component that owns all auth state. The routing logic works as follows:

- `/` → `App` (public landing page with waitlist signup)
- `/auth` → `Auth` (standalone login/signup page)
- `/app` → `AppRoute` (protected):
  1. No session → `Auth` (login/signup)
  2. Session but no profile in DB → `Onboarding`
  3. Session + profile → `App2` (main app)

`Root` checks Supabase `profiles` table on load and after auth state changes to determine whether to show Onboarding. `onComplete` in Onboarding flips `hasProfile` state to navigate forward without a full reload.

### Key Components

- **`App.jsx`** — Public marketing/landing page. Purely presentational with scroll-triggered animations (`useInView` via `IntersectionObserver`) and a waitlist email form (currently frontend-only, no backend submission).
- **`App2.jsx`** — The main app shell with three tabs: Discover (swipe cards), Matches, Profile. Currently uses **hardcoded mock data** (`PROFILES`, `YOUR_PROFILE`) — not yet wired to Supabase. Swipe logic is drag/touch-based with 100px threshold on desktop, 80px on mobile.
- **`Auth.jsx`** — Login/signup form using Supabase Auth (`signUp`, `signInWithPassword`). After login, redirects to `/app` via `window.location.href`.
- **`Onboarding.jsx`** — 3-step wizard collecting name/neighborhood, skill offered (single), and skills wanted (multi-select). On complete, POSTs directly to Supabase REST API (`/rest/v1/profiles`) using the anon key. `seeking` is stored as a comma-separated string.
- **`supabase.js`** — Supabase client singleton initialized from env vars.

### Supabase Schema (inferred)

`profiles` table with columns: `id` (user UUID), `full_name`, `location` (neighborhood string), `bio`, `offering` (skill label), `offering_icon` (emoji), `seeking` (comma-separated labels).

### Design System

Consistent dark theme across all components:
- Background: `#080b14` (page), `#0f1623` (cards), `#111827` (panels)
- Accent: `#eab308` (yellow) for interactive elements, highlights, CTAs
- Fonts: `Cormorant Garamond` (serif headings) + `DM Sans` (body) — loaded via Google Fonts inline `@import` in each component's `<style>` block
- All styling is inline (no CSS modules, no Tailwind)
