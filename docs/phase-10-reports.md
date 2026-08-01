# Phase 10 — Reports

**Status:** Complete (awaiting approval before Phase 11)  
**Scope:** Operational clinic metrics (aggregations) — not BI exports, scheduled digests, revenue charts, or insurance analytics

---

## What we built

| Capability | Who |
|------------|-----|
| Date-ranged clinic overview KPIs | ADMIN, RECEPTIONIST |
| Own-panel KPIs | DOCTOR |
| Appointment status / type breakdown | Staff · Doctor (own) |
| Prescription status breakdown | Staff · Doctor (own) |
| Daily appointment volume chart | Staff · Doctor (own) |
| Doctor workload table | ADMIN, RECEPTIONIST (clinic-wide only) |
| Filter by doctor | ADMIN, RECEPTIONIST |
| Patient access | Blocked (redirect) |

### Key files

```text
src/features/reports/
  schemas.ts
  constants.ts
  queries.ts
  components/
    report-filters.tsx
    report-summary-cards.tsx
    breakdown-bars.tsx
    daily-volume-chart.tsx
    doctor-workload-table.tsx

src/app/(app)/reports/page.tsx
```

---

## Architecture

```text
/reports RSC
  → requireTenantContext([ADMIN, RECEPTIONIST, DOCTOR])
  → clamp date range (max 90 days, UTC)
  → doctor scope: forced for DOCTOR; optional filter for staff
  → Prisma groupBy / count (tenantId always from session)
  → presentational breakdown components (CSS bars, no chart lib)
```

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Doctors never see clinic-wide doctor comparison or other clinicians’ panels.
3. Patients cannot open `/reports`.
4. Receptionist gets the same operational views as admin for this phase (schedule + Rx counts + workload) — revenue stays for Billing.

### Why no Report model?

Reports are **derived reads**. Persisting snapshot rows would add write paths and stale data without helping ThemeForest demos. Recompute from appointments / prescriptions / encounters.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `admin@demo-clinic.local` / `DemoPass123!`
2. Open **Reports** → try **Last 7 / 30 / 90 days** and doctor filter
3. Sign in as `doctor@demo-clinic.local` → **Reports** shows only that doctor’s metrics
4. Sign in as `patient@demo-clinic.local` → `/reports` redirects to dashboard

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| CSS bars instead of Recharts | Zero new deps; ThemeForest-simple | Less interactive charts |
| Max 90-day window | Bounded query cost | No multi-year analytics |
| UTC day boundaries | Matches appointment module | Local TZ nuance deferred |
| Receptionist ≈ admin ops metrics | Believable front-desk oversight | Fine-grained report ACLs later |
| Skip CSV / PDF export | Keeps phase thin | Buyers may want export in packaging phase |

---

## Common mistakes avoided

- Letting clients pick `tenantId` for aggregations
- Giving patients clinic-wide analytics
- Building billing revenue inside Reports (Phase 11 owns invoices)
- Mirroring dashboard counts into Redux

---

## Phase gate

**Next:** Phase 11 — Billing

Do **not** start the next phase until you explicitly approve Phase 10.
