# Phase 8 — Prescription Module

**Status:** Complete  
**Scope:** Basic Rx CRUD + status workflow (no pharmacy integrations, e-prescribe networks, or medication databases)

---

## What we built

| Capability | Who |
|------------|-----|
| List / filter prescriptions | ADMIN, RECEPTIONIST (clinic read) · DOCTOR (own) · PATIENT (own) |
| Create Rx (+ line items) | DOCTOR (own signature only) |
| Edit draft items / notes | DOCTOR (own drafts) |
| Issue / complete / cancel | DOCTOR (own) |
| Optional link to appointment | One Rx per appointment (`appointmentId` unique) |
| View detail | Same visibility as list |

### Key files

```text
src/features/prescriptions/
  schemas.ts
  constants.ts
  queries.ts
  actions.ts
  components/
    prescription-list.tsx
    prescription-form.tsx
    prescription-status-actions.tsx

src/app/(app)/prescriptions/
  page.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx
```

---

## Architecture

```text
RSC → requireTenantContext → tenant-scoped Prisma queries
Forms → Server Actions → Zod → role/ownership → write items → revalidatePath
```

### Status workflow

```text
DRAFT → ACTIVE → COMPLETED
     ↘ CANCELLED     ↘ CANCELLED
```

Issuing (`DRAFT` → `ACTIVE`) sets `issuedAt`. Only **DRAFT** prescriptions are editable.

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Doctors write **only** prescriptions where `doctorProfile.userId === session.user.id`.
3. Patients never enumerate clinic Rx — only their own.
4. Admin / receptionist are **read-only** (oversight / front-desk lookup), matching Phase 1 clinical matrix.
5. Linked appointments must belong to the same tenant, doctor, and patient.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `doctor@demo-clinic.local` / `DemoPass123!`
2. Open **Prescriptions** → open the seeded ACTIVE Rx
3. **New prescription** → add medications → save as draft → **Issue**
4. Sign in as `patient@demo-clinic.local` → confirm view-only of own Rx
5. Confirm reception can list but cannot create

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Free-text medication fields | No drug DB dependency for ThemeForest | No formulary / interaction checks |
| Doctor-only writes | Matches clinical permission matrix | Admin cannot “fix” a typo after issue |
| Replace-all items on draft update | Simple transaction | Concurrent editors can overwrite |
| Skip Encounter coupling | Keeps Phase 8 thin | Visit notes stay for Medical History phase |

---

## Common mistakes avoided

- Letting receptionists invent clinical orders
- Editing ACTIVE / COMPLETED prescriptions
- Attaching an appointment already linked to another Rx
- Mixing allergies / conditions into this phase

---

## Phase gate

**Next:** Phase 9 — Medical History — **started / complete** (see phase-9 doc)
