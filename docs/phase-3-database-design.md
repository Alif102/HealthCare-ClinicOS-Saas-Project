# Phase 3 — Database Design

**Status:** Complete — migrated + seeded on dedicated Neon database (Option A).  
**ORM:** Prisma **6.19** (pinned — see trade-offs)  
**Provider:** PostgreSQL (Neon)  
**Migration:** `prisma/migrations/20260731113029_init`  
**Seed:** tenant `demo-clinic`

---

## What we built

1. Full Prisma schema at [`prisma/schema.prisma`](../prisma/schema.prisma)
2. Prisma client singleton at [`src/lib/db.ts`](../src/lib/db.ts)
3. Demo seed (`demo-clinic` tenant) at [`prisma/seed.ts`](../prisma/seed.ts)
4. Scripts: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`
5. `DIRECT_URL` added to `.env.local` (non-pooler host for migrations)

### Domain coverage (aligned to Phase 1)

| Area | Models |
|------|--------|
| Better Auth (Phase 4-ready) | `User`, `Session`, `Account`, `Verification` |
| Tenancy | `Tenant`, `TenantMembership` (+ `Role`) |
| Doctor | `DoctorProfile`, `DoctorAvailability` |
| Patient | `PatientProfile` |
| Appointments | `Appointment` |
| Clinical | `Encounter`, `Allergy`, `MedicalCondition` |
| Rx | `Prescription`, `PrescriptionItem` |
| Billing | `Invoice`, `Payment` |
| Video / Alerts | `ConsultationSession`, `Notification` |

Hybrid rule: clinic-scoped tables include `tenantId` + indexes.

---

## Neon connection (resolved)

Chose **Option A** — dedicated Neon database (`ep-autumn-rice-aykewj49`, us-east-2).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled (`-pooler`) — app runtime |
| `DIRECT_URL` | Direct (no pooler) — Prisma Migrate |

Previous shared DB (estateora) was left untouched.

---

## Architecture notes

```text
App (Vercel / Next.js)
  └─ prisma (DATABASE_URL = pooled Neon)
Prisma CLI (migrate)
  └─ DIRECT_URL = non-pooler Neon
```

Auth tables are included now so Phase 4 does not force a schema rewrite. Roles live on `TenantMembership`, not on `User` alone (supports hybrid multi-clinic later).

### Why not Better Auth Organization plugin tables?

Clinic OS needs `ADMIN | RECEPTIONIST | DOCTOR | PATIENT`. Better Auth org roles are typically `owner/admin/member`. Custom `Tenant` + `TenantMembership` matches the product; we can still use Better Auth for sessions/OAuth.

### Why Prisma 6 instead of 7?

Prisma 7 requires `prisma.config.ts` + driver adapters (`@prisma/adapter-neon`) for Neon. Prisma 6 keeps ThemeForest setup simpler (`url` / `directUrl` in schema). We can upgrade later.

---

## Commands (after DB path is cleared)

```bash
pnpm db:migrate --name init   # create migration + apply
pnpm db:seed                  # seed demo-clinic tenant
pnpm db:studio                # browse data
```

---

## Security / tenancy reminders

- Always filter by `tenantId` from the trusted session — never from the client alone.
- Do not import `@/lib/db` into Client Components.
- `.env.local` stays gitignored.

---

## Phase gate

Schema is on Neon and `demo-clinic` is seeded.

**Do not start Phase 4 until you explicitly approve Phase 3.**

Next: **Phase 4 — Authentication** (Better Auth + Google OAuth using your existing `AUTH_*` env vars).
