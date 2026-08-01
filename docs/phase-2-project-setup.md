# Phase 2 — Project Setup

**Status:** Complete (awaiting approval before Phase 3)  
**Product:** ClinicOS (Healthcare SaaS)

---

## What we set up

| Item | Detail |
|------|--------|
| Framework | Next.js **16** (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS **v4** + shadcn/ui (neutral base tokens) |
| State | Redux Toolkit + typed hooks (`useAppDispatch` / `useAppSelector`) |
| Forms/validation | React Hook Form + Zod + `@hookform/resolvers` (wired as deps) |
| Motion | Framer Motion |
| Package manager | **pnpm** |
| Structure | Feature-based folders under `src/features/*` |

### Intentionally **not** installed yet

- Prisma / PostgreSQL (Phase 3 — needs `DATABASE_URL`)
- Better Auth (Phase 4 — needs auth secrets)
- UploadThing / Resend (later phases — need API keys)

No fake secrets were created.

---

## Folder architecture

```text
src/
  app/                 # Routes only (thin)
  components/
    ui/                # shadcn primitives
    providers/         # AppProviders, StoreProvider
    shared/            # Cross-feature presentational pieces (empty for now)
  features/            # Domain modules (auth, doctors, patients, ...)
  store/               # RTK store + UI slice
  lib/                 # utils, shared validations
  config/              # site metadata constants
  types/               # shared types (roles)
  hooks/               # shared React hooks (empty for now)
```

**Rule of thumb:** routes compose features; features own UI + logic for that domain; `components/ui` stays dumb/reusable.

---

## How to run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Phase 2 foundation page and a working Redux toggle.

```bash
pnpm build   # production build check
pnpm lint    # ESLint
```

---

## Why these choices

1. **`src/` directory** — keeps app code separate from config; standard for larger SaaS.
2. **Feature folders** — ThemeForest and portfolio reviewers can navigate by domain; avoids a dumping-ground `components/` tree.
3. **RTK store created empty of domain data** — satisfies the stack without teaching the anti-pattern of caching the whole API in Redux.
4. **shadcn + CSS variables** — ThemeForest buyers can retheme via tokens; components stay copy-owned (no closed UI kit dependency).
5. **Plus Jakarta Sans** — readable product UI font; avoids generic Inter/system stacks.
6. **pnpm** — faster, stricter dependency tree; good for reproducible ThemeForest packages.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Defer Prisma/Auth | No blocked env gates; clean Phase 2 | Can't log in or query DB yet |
| Neutral shadcn theme | Safe base; brand colors later | Not final ThemeForest visual identity yet |
| Client home page | Proves RTK + Framer Motion | Home will become a Server Component marketing page later |
| Next.js 16 | Latest App Router | Read `node_modules/next/dist/docs` when APIs differ from older tutorials |

---

## Common mistakes avoided

- Installing every package on day one (UploadThing/Resend without keys)
- Putting business logic in `layout.tsx`
- Creating a giant `services/` folder before domains exist
- Committing `.env` with placeholder secrets

---

## Phase gate

**Next:** Phase 3 — Database Design (Prisma schema, hybrid `tenantId`, Postgres).

Do **not** start Phase 3 until you explicitly approve Phase 2.
