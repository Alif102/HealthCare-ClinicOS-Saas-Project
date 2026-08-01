# Phase 6 — Patient Module

**Status:** Complete  
**Scope:** Patient registration + demographics only (no appointments/history CRUD yet)

---

## What we built

| Capability | Who |
|------------|-----|
| List + search patients | ADMIN, RECEPTIONIST, DOCTOR |
| View patient detail | Staff (all) · PATIENT (own only) |
| Register patient | ADMIN, RECEPTIONIST |
| Edit demographics | ADMIN, RECEPTIONIST, PATIENT (own) |
| `/patients/me` | PATIENT shortcut |

Doctors are **read-only** on patient demographics (clinical writes come with appointments/history later).

### Key files

```text
src/features/patients/
  schemas.ts
  queries.ts
  actions.ts
  constants.ts
  components/
    patient-list.tsx
    create-patient-form.tsx
    patient-profile-form.tsx

src/app/(app)/patients/
  page.tsx
  new/page.tsx
  me/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx
```

---

## Architecture

Same pattern as Doctors:

```text
RSC → requireTenantContext → tenant-scoped Prisma queries
Forms → Server Actions → Zod → role/ownership → write → revalidatePath
```

### Authorization rules

1. Every patient query filters by **`tenantId` from session**.
2. Patients cannot list or open other patients’ records.
3. Receptionists can register (front-desk reality for Clinic OS / ThemeForest).
4. Counters on detail (`appointments`, `allergies`, …) are placeholders until later phases.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `reception@demo-clinic.local` / `DemoPass123!`
2. Open **Patients** → search / register
3. Sign in as `patient@demo-clinic.local` → **My profile**
4. Confirm doctor can view patients but cannot edit

Demo patient seed includes DOB, blood type, phone, and emergency contact.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Receptionist can create patients | Believable clinic workflow | Slightly broader write surface |
| Doctor read-only demographics | Clear separation vs clinical notes | Doctors must wait for later modules to chart |
| GET search form | Zero client JS for search | Full page navigation (fine for MVP) |

---

## Common mistakes avoided

- Letting patients enumerate the clinic roster
- Updating profiles without tenant + ownership checks
- Building allergies/conditions CRUD inside Phase 6 (that’s Medical History)

---

## Phase gate

**Next:** Phase 7 — Appointment Module — **started / complete** (see phase-7 doc)

Phase 6 remains the demographics baseline for later clinical modules.
