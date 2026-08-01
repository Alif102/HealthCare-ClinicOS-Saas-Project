# Phase 4 — Authentication

**Status:** Complete (awaiting approval before Phase 5)  
**Provider:** Better Auth + Prisma + Neon  
**Methods:** Email/password + Google OAuth

---

## What we built

| Piece | Location |
|-------|----------|
| Auth server | [`src/lib/auth.ts`](../src/lib/auth.ts) |
| Auth client | [`src/lib/auth-client.ts`](../src/lib/auth-client.ts) |
| Session helpers | [`src/lib/auth-session.ts`](../src/lib/auth-session.ts) |
| API handler | [`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/[...all]/route.ts) |
| Sign-in / Sign-up | `/sign-in`, `/sign-up` |
| Protected shell | `/dashboard` under `(app)` layout |
| Proxy gate | [`src/proxy.ts`](../src/proxy.ts) (Next.js 16) |
| Demo seed users | [`prisma/seed.ts`](../prisma/seed.ts) |

### Behavior

1. **Email/password** sign-up and sign-in via Better Auth
2. **Google OAuth** when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set
3. New public sign-ups join **`demo-clinic` as `PATIENT`** (+ `PatientProfile`)
4. Session stores **`activeTenantId`** from the first active membership
5. Proxy redirects unauthenticated users away from `/dashboard`
6. Dashboard layout still calls **`requireSession()`** (real server check)

---

## Demo credentials

Shared password for all seeded users: **`DemoPass123!`**

| Email | Role |
|-------|------|
| `admin@demo-clinic.local` | ADMIN |
| `reception@demo-clinic.local` | RECEPTIONIST |
| `doctor@demo-clinic.local` | DOCTOR |
| `patient@demo-clinic.local` | PATIENT |

Re-seed anytime:

```bash
pnpm db:seed
```

---

## Google OAuth setup (required for Google button)

In Google Cloud Console → Credentials → your OAuth client, add:

**Authorized redirect URI**

```text
http://localhost:3000/api/auth/callback/google
```

Without this, Google sign-in fails even if client ID/secret are correct.

---

## Env vars used (already in `.env.local`)

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Better Auth signing secret |
| `AUTH_URL` | App base URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | Auth client base URL |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `DATABASE_URL` / `DIRECT_URL` | Prisma |

We map `AUTH_*` into Better Auth via explicit `secret` / `baseURL` (no rename required).

---

## Architecture

```text
Browser form
  → authClient.signIn / signUp
    → /api/auth/*
      → Better Auth + Prisma
        → user + session (+ activeTenantId)
        → TenantMembership (role)

proxy.ts        → cookie presence (optimistic)
requireSession  → DB-validated session (authoritative)
requireRole     → membership role check (for later modules)
```

### Why cookie-only proxy?

Edge/proxy should stay fast. Cookie checks are optimistic redirects only. **Never** trust them alone for mutations — always use `requireSession` / `requireRole` in Server Components and Server Actions.

### Why roles on membership?

A user can belong to clinics with different roles later. Putting `role` only on `User` breaks hybrid multi-tenancy.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Better Auth vs Clerk | ThemeForest-friendly, self-hosted | You own upgrades/security |
| Auto PATIENT on public sign-up | Instant demo onboarding | Staff must be invited/seeded, not self-registered as Admin |
| nextCookies plugin | Server Actions can set cookies | Must keep plugin last |
| No email verification yet | Faster Phase 4 | Add Resend verification in Notifications phase |

---

## Common mistakes avoided

- UI-only “auth” without server session checks
- Storing role only on `User`
- Calling Prisma from Client Components
- Trusting proxy cookie checks as security boundary

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

Open `/sign-in`, use a demo account, confirm `/dashboard` shows role + clinic.

---

## Phase gate

**Next:** Phase 5 — Doctor Module  

Do **not** start Phase 5 until you explicitly approve Phase 4.
