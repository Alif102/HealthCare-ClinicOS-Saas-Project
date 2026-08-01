# Phase 16 — Testing & Optimization

**Status:** Complete (awaiting approval before Phase 17)  
**Scope:** Vitest unit suite for pure domain logic, list `take` caps, list/report indexes, light Next.js polish — not Playwright e2e, not CI cloud secrets, not full page-2 cursor UI

---

## What we built

| Capability | Detail |
|------------|--------|
| Vitest unit tests | Slots, money, invoice numbers, tenant settings, AI local drafts, video URLs/status, status machines, pagination, report volume |
| Shared helpers | `clampTake`, `canTransition`, `formatInvoiceNumber` / `nextInvoiceSequence`, `buildDailyVolume` |
| List caps | Patients, doctors, accepting-doctors (+ existing appointment/invoice/Rx/notification/video caps via `clampTake`) |
| DB indexes | `(tenantId, createdAt)` / status / type composites for list & report sorts |
| Next polish | Shared `(app)/loading.tsx`, lazy `VideoRoom`, broader cookie auth gate in `proxy.ts` |

### Key files

```text
vitest.config.mts
src/lib/pagination.ts
src/lib/transitions.ts
src/**/*.test.ts

src/features/billing/invoice-number.ts
src/features/reports/daily-volume.ts
src/features/video/components/video-room-lazy.tsx
src/app/(app)/loading.tsx

prisma/migrations/20260801140000_phase16_list_indexes/
```

---

## Architecture

```text
pnpm test
  → Vitest (node) + @ path alias
  → Pure modules only (no live Postgres / Better Auth)

List queries
  → clampTake(default 50, max 100)  // video: 30/50; accepting doctors: 100/200

Reports daily volume
  → DB fetch timestamps → buildDailyVolume (dense UTC days)

Auth edge
  → proxy cookie gate covers billing/reports/admin/video/ai/notifications
  → Server Actions / RSC still own real authorization
```

### Why Vitest, not Playwright (yet)

| Choice | Upside | Cost |
|--------|--------|------|
| Unit tests on pure logic | Fast, no secrets, ThemeForest-friendly | Does not prove full UI flows |
| Skip e2e | Buyers run `pnpm test` without Docker/CI keys | Auth/DB regressions need manual smoke |
| Cap lists, not full cursor UI | Stops unbounded demos now | No “page 2” yet |

---

## How to try it

```bash
pnpm test
pnpm typecheck
pnpm db:push   # or migrate — applies Phase 16 indexes
pnpm build
```

Manual smoke (after seed): sign in → patients/doctors lists → book a slot → toggle AI in admin → open a video session (room loads lazily).

---

## Common mistakes avoided

- Testing Server Actions that need headers/DB without a harness (brittle)
- Requiring Playwright + seeded DB for ThemeForest buyers
- Claiming “full audit / compliance test suite”
- Leaving patients/doctors unbounded while other lists were capped

---

## Upgrade path (later)

- Playwright smoke: sign-in → dashboard (optional `DATABASE_URL` in CI)
- Cursor / “Load more” on patients & appointments
- SQL `date_trunc` aggregation for large report ranges
- GitHub Actions `pnpm test && pnpm typecheck` (no secrets required)

---

## Phase gate

**Next:** Phase 17 — Deployment (Vercel)

Do **not** start the next phase until you explicitly approve Phase 16.
