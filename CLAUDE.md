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
  lib/
    supabase.js         # Supabase client singleton
    skillsData.js       # Shared SKILLS array and NEIGHBORHOODS object
  components/
    SkillPicker.jsx     # Reusable skill selector with search + custom skill support
  pages/
    Landing.jsx         # Public marketing/landing page
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
- `/auth` → `Auth` (public)
- `/app` → `AppRoute` (protected):
  1. Loading → renders `null`
  2. No session → `Auth`
  3. Session, no profile row → `Onboarding`
  4. Session + profile → `BartrApp` (receives `profile` prop)
- `/chat/:userId` → `Chat` (self-contained auth check)
- `/profile/edit` → `EditProfile` (self-contained auth check)
- `/reset-password` → `ResetPassword` (handles Supabase recovery token from email link)

`checkProfile` fetches the full `profiles` row and stores it in `profile` state, passed down to `BartrApp`. `onComplete` in `Onboarding` calls `checkProfile` directly so profile is fetched immediately after onboarding without a page reload.

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
| `avatar_url` | text | Supabase Storage public URL |

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

Add new invite codes directly in the Supabase Table Editor. Codes are checked at signup before the account is created.

## Storage

**Bucket: `avatars`** — public bucket for profile photos.
- Files stored as `{userId}.{ext}` at bucket root
- Upload uses direct `fetch` to `/storage/v1/object/avatars/{path}` with both `apikey` and `Authorization: Bearer {session.access_token}` headers
- Session token fetched fresh via `supabase.auth.getSession()` immediately before upload
- `x-upsert: true` header allows re-uploading to replace existing photo
- Public URL pattern: `{SUPABASE_URL}/storage/v1/object/public/avatars/{userId}.{ext}?t={timestamp}` (cache-busted)
- RLS policies on `storage.objects`: INSERT and UPDATE policies scoped to `bucket_id = 'avatars'`

## Critical Workarounds

- **Supabase JS client insert timeout** — the JS client hangs silently on inserts. All DB writes use direct `fetch` to the Supabase REST API (`/rest/v1/...`) instead of `supabase.from(...).insert(...)`.
- **Legacy anon key required** — the new publishable key format causes silent timeouts on DB operations. Use the original anon key from the Supabase dashboard.
- **Both `apikey` and `Authorization` headers required** — every fetch to Supabase (REST API and Storage) must include both `apikey: ANON_KEY` and `Authorization: Bearer TOKEN`. Missing either causes auth failures.
- **Supabase `getSession`** wrapped in `.catch(() => {}).finally(() => setLoading(false))` — ensures loading state always resolves even if Supabase errors.
- **Multi-tab testing** — Supabase stores sessions in `localStorage`, shared across all tabs. Use an incognito window to test a second user simultaneously.
- **`or` filter across different columns** — PostgREST's `?or=(user_a.eq.X,user_b.eq.X)` is unreliable. Always use two separate queries (one per column) and merge in JS.
- **`Array.isArray()` guard on all fetch responses** — Supabase returns an error object (not an array) on failed queries. Always check before `.length` or `.map()`.
- **`keepalive: true` on swipe inserts** — ensures the swipe POST completes even if the user navigates away before it resolves.
- **Storage session token** — use `supabase.auth.getSession()` to get a fresh `access_token` immediately before any storage upload. Do not rely on the Supabase JS storage client to inject auth automatically.

## Key Components

- **`Landing.jsx`** — Purely presentational. Scroll-triggered animations via `IntersectionObserver`. Waitlist email form is UI-only (not connected to a mailing list). "Try the app" links to `/app`.
- **`BartrApp.jsx`** — Three-tab app (Discover, Matches, Profile). Receives `profile` prop from `main.jsx`. Contains `transformProfile(row)` to map DB rows to card shape, and `Avatar` component for photo-with-initials-fallback display. Fetches profiles excluding swiped + matched users. Swipe threshold: 100px desktop, 80px mobile. Match detection uses two separate queries. Profile tab shows bio, offering, seeking icons, stats, Edit Profile button, Sign Out.
- **`Auth.jsx`** — Email + password auth. Has three modes: `login`, `signup`, `forgot`. Signup requires an invite code (checked against `invite_codes` table before account creation). Forgot password calls `supabase.auth.resetPasswordForEmail` with `redirectTo: /reset-password`. Email confirmation required before login.
- **`ResetPassword.jsx`** — Listens for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`, shows new password form, calls `supabase.auth.updateUser({ password })`, redirects to `/app` on success.
- **`Onboarding.jsx`** — 3-step wizard: (1) name + NYC neighborhood + optional bio, (2) pick one offering, (3) multi-select skills to learn. Uses `SkillPicker` component. Saves via direct REST API fetch.
- **`EditProfile.jsx`** — Standalone page. Photo upload at top (circular avatar + 📷 button). Saves photo to Supabase Storage, then PATCHes profile row. Full page reload on save (`window.location.href = "/app"`) so `checkProfile` in `main.jsx` re-fetches updated data. Uses `SkillPicker` component for both offering and seeking.
- **`Chat.jsx`** — Full-screen messaging at `/chat/:userId`. Message fetch uses `sender_id=in.(X,Y)&receiver_id=in.(X,Y)`. Supabase Realtime subscription for live messages. Optimistic UI. Back button uses `navigate("/app")`.
- **`SkillPicker.jsx`** (`src/components/`) — Reusable skill selector. Search input filters existing skills. If search text has no exact case-insensitive match, shows "Add [text] as custom skill" button. Custom skills inserted to `custom_skills` table and become available to all users. Module-level cache (`_cache`) prevents duplicate fetches when multiple instances on the same page. Handles 409 (race condition) by re-fetching and highlighting the existing skill.
- **`skillsData.js`** (`src/lib/`) — Exports `SKILLS` array (24 built-in skills with icon + label) and `NEIGHBORHOODS` object (NYC boroughs → neighborhoods). Staten Island excluded intentionally.

## Design System

All styling is inline (no CSS modules, no Tailwind). `index.css` is intentionally empty.

- **Backgrounds:** `#080b14` (page), `#0f1623` (cards), `#111827` (panels)
- **Accent:** `#eab308` amber/gold for all interactive elements and highlights
- **Fonts:** `Cormorant Garamond` (serif display) + `DM Sans` (body) — loaded via Google Fonts `@import` inside each component's inline `<style>` block

## Security Notes (pre-scale)

The following shortcuts are acceptable for the current small invite-only launch but **must be addressed before opening to a larger audience:**

- RLS is disabled on all DB tables — no per-user data isolation
- RLS on `storage.objects` is permissive (any authenticated user can upload to avatars bucket) — should be locked to `name = auth.uid() || '.' || extension`
- Invite codes are checked client-side only — a determined person could bypass by calling the Supabase API directly

## Immediate Next Tasks

1. **Custom domain** — set up `bartr.app` or `bartr.co` before sharing with real users
2. **Waitlist email** — connect landing page form to Mailchimp or a Google Sheet
3. **Neighborhood-weighted matching** — show nearby users first in Discover
4. **Re-enable RLS** — before scaling beyond the friend circle (see Security Notes)

## Future Roadmap

- Neighborhood-weighted matching (show nearby users first)
- React Native conversion for App Store
- Video proof of skill on profiles
- Safety features (reporting, session check-ins)
- Connect waitlist email to Mailchimp or Beehiiv
- Custom domain (bartr.app or bartr.co)
