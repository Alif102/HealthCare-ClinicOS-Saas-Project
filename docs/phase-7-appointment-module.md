# Phase 7 — Appointment Module

**Status:** Complete  
**Scope:** Booking, clinic schedule views, and status workflow only (no encounters, Rx, billing, or video)

---

## What we built

| Capability | Who |
|------------|-----|
| List / filter appointments | ADMIN, RECEPTIONIST (clinic) · DOCTOR (own) · PATIENT (own) |
| Book from availability slots | ADMIN, RECEPTIONIST · DOCTOR (own calendar) · PATIENT (self) |
| View appointment detail | Same visibility rules as list |
| Advance / cancel status | Staff on allowed transitions · PATIENT cancel own upcoming |
| Slot generation from weekly templates | Shared server helper (uses Phase 5 availability) |

### Key files

```text
src/features/appointments/
  schemas.ts
  constants.ts
  slots.ts
  queries.ts
  actions.ts
  components/
    appointment-list.tsx
    book-appointment-form.tsx
    appointment-status-actions.tsx

src/app/(app)/appointments/
  page.tsx
  new/page.tsx
  [id]/page.tsx
```

---

## Architecture

Same pattern as Doctors / Patients:

```text
RSC → requireTenantContext → tenant-scoped Prisma queries
Forms → Server Actions → Zod → role/ownership → conflict check → write → revalidatePath
```

### Booking rules

1. Slots come from **active** `DoctorAvailability` rows for the chosen date’s weekday.
2. Slot length = `slotMinutes` on that template.
3. Occupied intervals (`SCHEDULED` … `IN_PROGRESS`, plus `COMPLETED` same day) block booking; `CANCELLED` / `NO_SHOW` free the slot.
4. Overlap check on create prevents double-booking even if UI is stale.
5. Times are stored as UTC `DateTime`s; demo tenant timezone is `UTC` (documented trade-off).

### Status workflow

```text
SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
         ↘ CANCELLED    ↘ NO_SHOW     ↘ CANCELLED
```

Patients may only cancel their own `SCHEDULED` / `CONFIRMED` visits.

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Doctors never see another doctor’s calendar via forged IDs.
3. Patients never enumerate the clinic schedule — only their appointments.
4. Receptionists can book for any patient/doctor (front-desk loop).

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `reception@demo-clinic.local` / `DemoPass123!`
2. Open **Appointments** → filter / open detail → change status
3. **Book appointment** → pick doctor + date → choose an open slot
4. Sign in as `patient@demo-clinic.local` → book / cancel own
5. Sign in as `doctor@demo-clinic.local` → confirm only own schedule is listed

Seed creates one upcoming demo appointment when none exist for the demo doctor/patient pair.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Generate slots at read time | No slot table to sync with availability edits | Slightly more CPU on book page |
| UTC wall-clock for demo | Matches seed tenant timezone | Real clinics need timezone-aware math later |
| Cancel + rebook instead of reschedule UI | Smaller Phase 7 surface | One extra step for staff |
| No encounter/Rx hooks yet | Clean module boundary | Detail page is schedule-focused only |

---

## Common mistakes avoided

- Accepting client-supplied `tenantId` or end times without re-deriving from availability
- Letting patients list clinic-wide appointments
- Double-booking without an overlap query
- Mixing clinical notes / billing into this phase

---

## Phase gate

**Next:** Phase 8 — Prescription Module — **started / complete** (see phase-8 doc)
