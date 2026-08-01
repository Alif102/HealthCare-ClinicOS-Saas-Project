# Phase 17 — Deployment (Vercel)

**Status:** Complete (awaiting approval before Phase 18)  
**Scope:** Production deploy of ClinicOS on Vercel with Neon Postgres — not custom domain DNS, not ThemeForest packaging docs (Phase 18)

---

## Live URLs

| URL | Role |
|-----|------|
| **https://getclinicos.vercel.app** | Primary public URL (auth `AUTH_URL` / `NEXT_PUBLIC_SITE_URL`) |
| https://clinicos-hq.vercel.app | Extra clean alias |
| https://clinicos-mu-jade.vercel.app | Vercel default production alias |

**Note:** `clinicos.vercel.app` is **already taken** globally on Vercel, so we claimed unique alternatives.

Project: `alif102s-projects/clinicos`  
Dashboard: https://vercel.com/alif102s-projects/clinicos

---

## What we configured

| Item | Detail |
|------|--------|
| Framework | Next.js (fixed from incorrect “Other” preset) |
| Build | `prisma generate && next build` |
| postinstall | `prisma generate` (no local `.env.local` on Vercel) |
| Env (prod/preview) | `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` |
| SSO protection | Disabled so the public internet can open the app |
| DB | Existing Neon Postgres (same as local) |

### Key repo changes for deploy

```text
package.json
  postinstall → prisma generate
  build → prisma generate && next build

.vercel/          # linked project (gitignored)
```

---

## Architecture

```text
Browser → getclinicos.vercel.app (Vercel Edge / Node)
       → Next.js App Router
       → Better Auth (AUTH_URL = production URL)
       → Prisma → Neon (DATABASE_URL pooler + DIRECT_URL)
```

---

## How to redeploy

```bash
pnpm dlx vercel@latest deploy --prod --yes
```

Or push from the Vercel dashboard after connecting Git.

### Optional env on Vercel later

- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — email notifications  
- `OPENAI_API_KEY` — live AI drafts  
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth (update Google redirect URIs to `https://getclinicos.vercel.app/api/auth/callback/google`)

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Reuse Neon for prod | Instant deploy, shared demo data | Dev/prod share one DB — rotate/isolate later |
| `getclinicos` not `clinicos` | Unique public hostname | Brand URL less perfect |
| Disable SSO protection | Public ThemeForest-style demo | Anyone can hit the URL |

---

## Common mistakes avoided

- Leaving `postinstall` tied to `.env.local` (breaks Vercel install)
- Shipping with Framework = Other + wrong output dir (404)
- Pointing `AUTH_URL` at a domain we do not own (`clinicos.vercel.app`)
- Leaving team SSO on (forces Vercel login before the app)

---

## Phase gate

**Next:** Phase 18 — ThemeForest Optimization & Documentation

Do **not** start the next phase until you explicitly approve Phase 17.
