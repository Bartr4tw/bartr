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
    EditProfile.jsx     # Edit profile page (name, neighborhood, bio, skills, photo, trade request)
    ProfileView.jsx     # Full profile page for any user (/profile/:userId)
    ResetPassword.jsx   # Password reset landing page (handles Supabase recovery token)
  assets/               # Images
  main.jsx              # Routing + auth state management
  index.css             # Intentionally empty (cleared to fix style conflicts)
public/
  favicon.svg           # Dark bark "b." rounded square icon
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
- `/profile/:userId` → `ProfileView` (self-contained auth check) — must be before `/profile/edit` in route order
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
- `trade_requests`: authenticated SELECT all; INSERT/UPDATE where `user_id = auth.uid()`
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
| `swaps_completed` | int | Defaults to 0; shown as a badge on ProfileView and SwipeCard when > 0 |
| `age` | int | Optional |
| `instagram_handle` | text | Optional, stored with or without leading @ |
| `linkedin_url` | text | Optional URL or path |
| `availability` | text[] | e.g. ["Mornings", "Weekends"] |
| `swap_preference` | text[] | e.g. ["In person", "Virtual"] |

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

Unique constraint on `(user_a, user_b)`. Created when mutual right swipes are detected, OR when a user sends the first message in a chat (using `resolution=ignore-duplicates` so it's idempotent).

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

**Table: `trade_requests`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Profile owner |
| `offering_skill` | text | What the user is offering in this trade |
| `offering_icon` | text | Emoji |
| `offering_qty` | int | Quantity (e.g. 3) |
| `offering_unit` | text | Unit (e.g. "sessions", "hours") |
| `wanting_skill` | text | What the user wants in return |
| `wanting_icon` | text | Emoji |
| `wanting_qty` | int | Quantity |
| `wanting_unit` | text | Unit |
| `note` | text | Optional note |
| `status` | text | `'open'` or `'closed'` |
| `created_at` | timestamptz | |

Only one active (`status=open`) trade request per user is shown. Users can create, edit, or remove their trade request from EditProfile.

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
- **Discover excludes matched users** — both the main Discover queue and the second-chance re-queue exclude all matched user IDs (fetched via two separate queries on `user_a` and `user_b`). If two users can't see each other, check for a stale match or swipe row.

## Key Components

- **`Landing.jsx`** — Fully responsive marketing page. Uses `useWindowWidth` hook for responsive layouts. Nav collapses to logo + CTA on mobile. Hero stacks vertically on mobile (card stack hidden). Stats strip wraps. Scroll-triggered animations via `IntersectionObserver`. Marquee animation via `@keyframes marquee`. No waitlist form — single "Get started →" CTA throughout.
- **`BartrApp.jsx`** — Three-tab app (Discover, Matches, Profile). Receives `profile` and `session` props from `main.jsx`. `session.access_token` used directly for all auth headers. Contains `transformProfile(row)`, `enrichWithTradeRequests(profiles)`, `Avatar` component, `useWindowWidth` hook, and `SwipeCard`/`MatchCard` sub-components. Swipe threshold: 100px desktop, 80px mobile. Match detection uses two separate queries. **Second chance mode**: when Discover queue empties, "Give another look →" button re-queues left-swiped profiles; swiping right in this mode PATCHes the existing swipe record. Profile tab click navigates to `/profile/:id` instead of rendering inline. Match signal highlights (banner + skill chips) use green (`#5a9e6f`), not terracotta.
- **`Auth.jsx`** — Email + password auth. Three modes: `login`, `signup`, `forgot`. No invite code required. Successful login redirects to `/app` via `window.location.href`. Forgot password calls `supabase.auth.resetPasswordForEmail` with `redirectTo: /reset-password`.
- **`ResetPassword.jsx`** — Listens for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`, shows new password form, calls `supabase.auth.updateUser({ password })`, redirects to `/app` on success.
- **`Onboarding.jsx`** — 3-step wizard: (1) name + NYC neighborhood + optional age + optional bio, (2) pick one offering, (3) multi-select skills to learn + optional availability + optional swap preference. Uses `SkillPicker` component. Saves via direct REST API fetch with fresh session token. Outer container uses `alignItems: flex-start` so SkillPicker content scrolls on short mobile screens.
- **`EditProfile.jsx`** — Standalone page with sticky header. Photo upload at top (circular avatar + 📷 button). Fields: name, neighborhood, bio, age, instagram, linkedin, availability, swap preference, offering, seeking. Also contains a Trade Request section: shows active request as a preview card (with Edit/Remove), a dashed "+" button to create one, or an inline form with two SkillPickers + qty/unit inputs + note field. Saves photo to Supabase Storage, then PATCHes profile row. Full page reload on save (`window.location.href = "/app"`).
- **`ProfileView.jsx`** — Full profile page at `/profile/:userId`. Self-detects via `session.user.id === userId` (isSelf). Parallel-fetches profile + open trade request via `Promise.all`. Shows: hero photo/initials with gradient overlay, name + age, location + join date, Instagram/LinkedIn links, offering block, trade request card (with Respond button hidden for self), wants-to-learn grid, availability, swap preference. Sticky bottom CTA: self → Edit Profile + Sign Out; other → 📌 + Message button.
- **`Chat.jsx`** — Full-screen messaging at `/chat/:userId`. Supports `?prefillMessage=` query param to pre-fill the input (used by trade request Respond flow). Shows other user's avatar photo if available. Message fetch uses `sender_id=in.(X,Y)&receiver_id=in.(X,Y)`. Supabase Realtime subscription for live messages. Optimistic UI. On first message send, creates a match record with `Prefer: resolution=ignore-duplicates` so it's idempotent. Back button uses `navigate("/app")`. Header tappable — navigates to `/profile/:userId`.
- **`SkillPicker.jsx`** (`src/components/`) — Reusable skill selector with horizontally scrollable category tabs, search input, and custom skill support. Anon headers used for SELECT (public data); `getAuthHeaders()` used for INSERT. Module-level cache (`_cache`) prevents duplicate fetches. Handles 409 race condition by re-fetching and highlighting existing skill.
- **`skillsData.js`** (`src/lib/`) — Exports `SKILLS` array (34 built-in skills with `{ icon, label, category }`), `CATEGORIES` array (`["All", "Sports & Fitness", "Music", "Tech", "Arts & Crafts", "Food", "Languages", "Other"]`), and `NEIGHBORHOODS` object (NYC boroughs → neighborhoods). Staten Island excluded intentionally.

## Trade Requests

Users can post a single open trade request advertising a specific exchange (e.g. "3 guitar lessons for 2 hours of Spanish tutoring"). These appear:
- As a card on the SwipeCard in Discover (between Offering and Availability sections)
- On ProfileView between Offering and Wants to Learn
- Managed via EditProfile (create / edit / remove)

The `enrichWithTradeRequests(profiles)` function in `BartrApp.jsx` bulk-fetches open trade requests for all profiles in one request (`user_id=in.(ids)`) to avoid N+1 queries.

Responding to a trade request navigates to `/chat/:userId?prefillMessage=...` with a pre-filled message. The Respond button on SwipeCard uses `stopPropagation` on `onMouseDown`/`onTouchStart` to prevent accidentally triggering the swipe drag.

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

**Additional color:** `#5a9e6f` — green used for match signal highlights (skill overlap banners, matched skill chips, trade request "Accepting responses" indicator). Not in the `C` object; used inline.

- **Fonts:** `Fraunces` (serif display headings) + `DM Sans` (body) — loaded via Google Fonts `@import` inside each component's inline `<style>` block
- **Buttons:** pill-shaped (`borderRadius: 100`), primary = terracotta, ghost = sand border
- **All buttons/tap targets:** `minHeight: 44px` throughout for mobile usability
- **Responsive:** all pages use `useWindowWidth()` hook or CSS `clamp()` for font scaling; mobile breakpoint at `768px`, tablet at `1024px`

## Never Do This

- **Never use `supabase.from(...).insert()`** — the JS client hangs silently on inserts. Always use direct `fetch` to the REST API.
- **Never use the new publishable key format** — causes silent timeouts on DB operations. Use the legacy anon key from the Supabase dashboard.
- **Never introduce CSS modules, Tailwind, or external stylesheets** — all styling is inline. `index.css` is intentionally empty.
- **Never add a test suite** — none is configured and none is expected.

## Security Notes (pre-scale)

RLS is now enabled on all tables and storage. Remaining items before a larger public launch:

- Storage RLS is scoped to `split_part(name, '.', 1) = auth.uid()::text` — enforces users can only upload their own avatar
- Invite code check was client-side only and has since been removed entirely — signup is now open

## Immediate Next Tasks

1. **Custom domain** — set up `bartr.app` or `bartr.co` before sharing with real users
2. **Neighborhood-weighted matching** — show nearby users first in Discover
3. **Notifications** — no push or in-app notification system yet; users don't know when they get a message
4. **Waitlist / invite management** — no current mechanism to limit signups now that invite codes are removed

## Future Roadmap

- Neighborhood-weighted matching (show nearby users first)
- Push notifications for new messages / matches
- React Native conversion for App Store
- Video proof of skill on profiles
- Safety features (reporting, session check-ins)
- Custom domain (bartr.app or bartr.co)
- Re-add invite gating if needed (e.g. a simple waitlist + approval flow)
