# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mission

Bartr is a skill and hobby trading app built on the belief that every person has something worth teaching and something worth learning. In a world where AI is causing people to question the value of human skills, Bartr pushes back — celebrating what humans are uniquely capable of by connecting them with each other.

Tagline: **"Teach what you know. Learn what you don't."**

Works like a dating app for skills — users swipe through profiles of people offering skills or hobbies. When two people want what the other has, it's a match. No money changes hands. Currently open to anyone (no invite code required), NYC-focused.

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
  lib/
    supabase.js         # Supabase client singleton + getAuthHeaders() helper
    skillsData.js       # SKILLS array (categorized), CATEGORIES, NEIGHBORHOODS
  components/
    SkillPicker.jsx     # Reusable skill selector with categories, search, custom skill support
  pages/
    Landing.jsx         # Public marketing/landing page (fully responsive)
    BartrApp.jsx        # Main app UI (swipe interface, 3 tabs)
    Auth.jsx            # Login / signup / forgot password
    Onboarding.jsx      # 3-step new user setup
    Chat.jsx            # Real-time 1:1 messaging between matched users
    EditProfile.jsx     # Edit profile page (name, neighborhood, bio, skills, photo)
    ResetPassword.jsx   # Password reset landing page (handles Supabase recovery token)
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

`main.jsx` contains the top-level `Root` component that owns all auth state (`session`, `loading`, `hasProfile`, `profile`). `AppRoute` is defined outside `Root` to prevent remounting on every render.

- `/` → `Landing` (public)
- `/auth` → `Auth` (public) — redirects to `/app` on successful login via `window.location.href`
- `/app` → `AppRoute` (protected):
  1. Loading → renders `null`
  2. No session → `Auth`
  3. Session, no profile row → `Onboarding`
  4. Session + profile → `BartrApp` (receives `profile` and `session` props)
- `/chat/:userId` → `Chat` (self-contained auth check)
- `/profile/edit` → `EditProfile` (self-contained auth check)
- `/reset-password` → `ResetPassword` (handles Supabase recovery token from email link)

`checkProfile(userId, accessToken)` fetches the full `profiles` row using the real session JWT and stores it in `profile` state, passed down to `BartrApp`. `onComplete` in `Onboarding` calls `checkProfile` directly so profile is fetched immediately after onboarding without a page reload.

## Database

**RLS is enabled on all tables.** Policies use real session JWTs (`auth.uid()`), not the anon key.

**RLS policy summary:**
- `profiles`: any authenticated user can SELECT all; INSERT/UPDATE own row only (`id = auth.uid()`)
- `swipes`: SELECT where `swiper_id = auth.uid()` OR `swiped_id = auth.uid()`; INSERT own swipes
- `matches`: SELECT/INSERT where `user_a = auth.uid()` OR `user_b = auth.uid()`
- `messages`: SELECT where sender or receiver = `auth.uid()`; INSERT where `sender_id = auth.uid()`
- `custom_skills`: public SELECT (anon OK); authenticated INSERT
- `invite_codes`: public SELECT (needed for pre-auth checks, though invite codes are no longer required at signup)

Foreign key constraint on `profiles.id` was dropped to allow test inserts with fake UUIDs.

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
| `avatar_url` | text | Supabase Storage public URL |

**Table: `swipes`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `swiper_id` | uuid | User who swiped |
| `swiped_id` | uuid | User who was swiped on |
| `direction` | text | `'left'` or `'right'` |
| `created_at` | timestamptz | |

Unique constraint on `(swiper_id, swiped_id)`. When a user gets a second chance at a left-swiped profile, the existing row is **PATCHed** (not re-inserted) to update direction.

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

Supabase Realtime is enabled on messages: `alter publication supabase_realtime add table messages;` (already run).

**Table: `custom_skills`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `label` | text | Skill name — unique index on `lower(label)` to prevent case-insensitive duplicates |
| `icon` | text | Always `✨` for custom skills |
| `created_at` | timestamptz | |

**Table: `invite_codes`**

| Column | Type | Notes |
|---|---|---|
| `code` | text | Primary key |
| `created_at` | timestamptz | |

Invite codes are no longer required at signup. The table remains in the DB but is unused by the app.

## Storage

**Bucket: `avatars`** — public bucket for profile photos.
- Files stored as `{userId}.{ext}` at bucket root
- Upload uses direct `fetch` to `/storage/v1/object/avatars/{path}` with both `apikey` and `Authorization: Bearer {session.access_token}` headers
- Session token fetched fresh via `supabase.auth.getSession()` immediately before upload
- `x-upsert: true` header allows re-uploading to replace existing photo
- Public URL pattern: `{SUPABASE_URL}/storage/v1/object/public/avatars/{userId}.{ext}?t={timestamp}` (cache-busted)
- RLS policies on `storage.objects`: INSERT and UPDATE scoped to `bucket_id = 'avatars'` and `split_part(name, '.', 1) = auth.uid()::text`

## Critical Workarounds

- **Supabase JS client insert timeout** — the JS client hangs silently on inserts. All DB writes use direct `fetch` to the Supabase REST API (`/rest/v1/...`) instead of `supabase.from(...).insert(...)`.
- **Legacy anon key required** — the new publishable key format causes silent timeouts on DB operations. Use the original anon key from the Supabase dashboard.
- **Both `apikey` and `Authorization` headers required** — every fetch to Supabase (REST API and Storage) must include both `apikey: ANON_KEY` and `Authorization: Bearer TOKEN`. Missing either causes auth failures.
- **Real session JWT for RLS** — `auth.uid()` in RLS policies requires the real session JWT in the `Authorization: Bearer` header. Use `getAuthHeaders()` from `supabase.js` for writes, or pass `session.access_token` directly. Never use the anon key as the Bearer token for authenticated operations.
- **`getAuthHeaders()` helper** — exported from `supabase.js`. Calls `supabase.auth.getSession()` and returns `{ apikey, Authorization: Bearer <session token> }`. Use for any write that requires the authenticated user's identity.
- **Supabase `getSession`** wrapped in `.catch(() => {}).finally(() => setLoading(false))` — ensures loading state always resolves even if Supabase errors.
- **Multi-tab testing** — Supabase stores sessions in `localStorage`, shared across all tabs. Use an incognito window to test a second user simultaneously.
- **`or` filter across different columns** — PostgREST's `?or=(user_a.eq.X,user_b.eq.X)` is unreliable. Always use two separate queries (one per column) and merge in JS.
- **`Array.isArray()` guard on all fetch responses** — Supabase returns an error object (not an array) on failed queries. Always check before `.length` or `.map()`.
- **`keepalive: true` on swipe inserts** — ensures the swipe POST completes even if the user navigates away before it resolves.
- **Storage session token** — use `supabase.auth.getSession()` to get a fresh `access_token` immediately before any storage upload. Do not rely on the Supabase JS storage client to inject auth automatically.
- **Second chance swipes use PATCH not POST** — swipes has a unique constraint on `(swiper_id, swiped_id)`. When re-queuing left-swiped profiles, update direction via `PATCH /rest/v1/swipes?swiper_id=eq.X&swiped_id=eq.Y`.

## Key Components

- **`Landing.jsx`** — Fully responsive marketing page. Uses `useWindowWidth` hook for responsive layouts. Nav collapses to logo + CTA on mobile. Hero stacks vertically on mobile (card stack hidden). Stats strip wraps. Scroll-triggered animations via `IntersectionObserver`. Marquee animation via `@keyframes marquee`. No waitlist form — single "Get started →" CTA throughout.
- **`BartrApp.jsx`** — Three-tab app (Discover, Matches, Profile). Receives `profile` and `session` props from `main.jsx`. `session.access_token` used directly for all auth headers. Contains `transformProfile(row)`, `Avatar` component, `useWindowWidth` hook, and `SwipeCard`/`MatchCard` sub-components. Swipe threshold: 100px desktop, 80px mobile. Match detection uses two separate queries. **Second chance mode**: when Discover queue empties, "Give another look →" button re-queues left-swiped profiles; swiping right in this mode PATCHes the existing swipe record.
- **`Auth.jsx`** — Email + password auth. Three modes: `login`, `signup`, `forgot`. No invite code required. Successful login redirects to `/app` via `window.location.href`. Forgot password calls `supabase.auth.resetPasswordForEmail` with `redirectTo: /reset-password`.
- **`ResetPassword.jsx`** — Listens for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`, shows new password form, calls `supabase.auth.updateUser({ password })`, redirects to `/app` on success.
- **`Onboarding.jsx`** — 3-step wizard: (1) name + NYC neighborhood + optional bio, (2) pick one offering, (3) multi-select skills to learn. Uses `SkillPicker` component. Saves via direct REST API fetch with fresh session token. Outer container uses `alignItems: flex-start` so SkillPicker content scrolls on short mobile screens.
- **`EditProfile.jsx`** — Standalone page with sticky header. Photo upload at top (circular avatar + 📷 button). Saves photo to Supabase Storage, then PATCHes profile row. Full page reload on save (`window.location.href = "/app"`) so `checkProfile` re-fetches updated data. Uses `SkillPicker` for both offering and seeking.
- **`Chat.jsx`** — Full-screen messaging at `/chat/:userId`. Shows other user's avatar photo if available. Message fetch uses `sender_id=in.(X,Y)&receiver_id=in.(X,Y)`. Supabase Realtime subscription for live messages. Optimistic UI. Back button uses `navigate("/app")`.
- **`SkillPicker.jsx`** (`src/components/`) — Reusable skill selector with horizontally scrollable category tabs, search input, and custom skill support. Anon headers used for SELECT (public data); `getAuthHeaders()` used for INSERT. Module-level cache (`_cache`) prevents duplicate fetches. Handles 409 race condition by re-fetching and highlighting existing skill.
- **`skillsData.js`** (`src/lib/`) — Exports `SKILLS` array (33 built-in skills with `{ icon, label, category }`), `CATEGORIES` array (`["All", "Sports & Fitness", "Music", "Tech", "Arts & Crafts", "Food", "Languages", "Other"]`), and `NEIGHBORHOODS` object (NYC boroughs → neighborhoods). Staten Island excluded intentionally.

## Design System

All styling is inline (no CSS modules, no Tailwind). `index.css` is intentionally empty.

**Color tokens** (defined as `const C = {...}` in each component):
```js
const C = {
  cream: "#FAF6EE",       // page background
  warmWhite: "#FDFAF4",   // card/panel background
  sand: "#F5EFE0",        // input background, secondary panels
  sandDark: "#EDE3CC",    // borders
  clay: "#C07A52",        // secondary accent
  clayDeep: "#9B5C38",    // logo color, dark accent
  terracotta: "#D4714A",  // primary CTA, highlights, my messages
  bark: "#4A3728",        // primary text
  barkLight: "#7A5C47",   // secondary text, labels
};
```

- **Fonts:** `Fraunces` (serif display headings) + `DM Sans` (body) — loaded via Google Fonts `@import` inside each component's inline `<style>` block
- **Buttons:** pill-shaped (`borderRadius: 100`), primary = terracotta, ghost = sand border
- **All buttons/tap targets:** `minHeight: 44px` throughout for mobile usability
- **Responsive:** all pages use `useWindowWidth()` hook or CSS `clamp()` for font scaling; mobile breakpoint at `768px`, tablet at `1024px`

## Security Notes (pre-scale)

RLS is now enabled on all tables and storage. Remaining items before a larger public launch:

- Storage RLS is scoped to `split_part(name, '.', 1) = auth.uid()::text` — enforces users can only upload their own avatar
- Invite code check was client-side only and has since been removed entirely — signup is now open

## Immediate Next Tasks

1. **Custom domain** — set up `bartr.app` or `bartr.co` before sharing with real users
2. **Neighborhood-weighted matching** — show nearby users first in Discover
3. **Empty states** — what Discover looks like when second-chance queue is also empty; already handled, but could be more engaging
4. **Waitlist / invite management** — no current mechanism to limit signups now that invite codes are removed

## Future Roadmap

- Neighborhood-weighted matching (show nearby users first)
- React Native conversion for App Store
- Video proof of skill on profiles
- Safety features (reporting, session check-ins)
- Custom domain (bartr.app or bartr.co)
- Re-add invite gating if needed (e.g. a simple waitlist + approval flow)
