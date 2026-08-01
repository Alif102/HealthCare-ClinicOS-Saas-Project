# Phase 9 — Medical History

**Status:** Complete  
**Scope:** Allergies, conditions, and encounter (visit) notes only — not full EMR charting, ICD coding, or document uploads

---

## What we built

| Capability | Who |
|------------|-----|
| View patient clinical chart | Staff (clinic) · PATIENT (own) |
| Add / edit / delete allergies | ADMIN, RECEPTIONIST, DOCTOR · PATIENT (own) |
| Add / edit / delete conditions | ADMIN, RECEPTIONIST, DOCTOR · PATIENT (own) |
| Create / update encounter notes | DOCTOR (own visit only) |
| View encounter | Same visibility as the linked appointment |
| Link from appointment → encounter | One encounter per appointment |

### Key files

```text
src/features/medical-history/
  schemas.ts
  constants.ts
  queries.ts
  actions.ts
  components/
    allergy-form.tsx
    allergy-list.tsx
    condition-form.tsx
    condition-list.tsx
    encounter-form.tsx
    encounter-summary.tsx

src/app/(app)/patients/[id]/history/page.tsx
src/app/(app)/appointments/[id]/encounter/page.tsx
src/app/(app)/encounters/[id]/page.tsx
```

---

## Architecture

```text
Patient history RSC
  → requireTenantContext + ownership
  → list allergies / conditions / encounters (tenant-scoped)

Encounter form
  → Server Action
    → Zod validate
    → doctor must own the appointment
    → upsert Encounter (1:1 with Appointment)
    → revalidatePath
```

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Patients never open another patient’s chart.
3. Encounter writes require the signed-in doctor to match `appointment.doctorProfile`.
4. Admin / receptionist may manage allergies/conditions (intake) but not clinical encounter notes.
5. `vitalsJson` is a small free-form object (BP, HR, temp, weight) — not a vitals device integration.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `reception@demo-clinic.local` / `DemoPass123!`
2. Open **Patients** → Pat Patient → **Medical history** → add allergy/condition
3. Sign in as `doctor@demo-clinic.local` → open an appointment → **Write visit notes**
4. Sign in as `patient@demo-clinic.local` → **My profile** → Medical history (read/self-report)

Seed adds a penicillin allergy, seasonal asthma condition, and (when possible) an encounter on the demo appointment.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| History lives under `/patients/[id]/history` | Natural chart home | No clinic-wide “all encounters” inbox |
| Free-text severity / condition status | Fast ThemeForest demo | No coded SNOMED/ICD yet |
| Encounter upsert per appointment | Matches schema unique constraint | No multi-note timeline per visit |
| Patient can self-report allergies/conditions | Believable portal | Staff should still verify clinically |

---

## Common mistakes avoided

- Writing encounters without doctor ownership checks
- Letting patients edit another chart via forged IDs
- Stuffing allergies into demographics (Phase 6 boundary)
- Building billing / Rx inside this phase

---

## Phase gate

**Next:** Phase 10 — Reports — **started / complete** (see phase-10 doc).
