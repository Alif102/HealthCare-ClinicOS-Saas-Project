# Phase 5 — Doctor Module

**Status:** Complete (awaiting approval before Phase 6)  
**Scope:** Doctor profiles + weekly availability only (no appointments yet)

---

## What we built

| Capability | Who |
|------------|-----|
| List doctors | All clinic roles |
| View doctor detail + availability | All clinic roles |
| Create doctor account + profile | ADMIN |
| Edit clinical profile | ADMIN or self (DOCTOR) |
| Add / pause / delete availability | ADMIN or self (DOCTOR) |
| `/doctors/me` shortcut | DOCTOR |

### Key files

```text
src/features/doctors/
  schemas.ts
  queries.ts
  actions.ts
  constants.ts
  components/
    doctor-list.tsx
    create-doctor-form.tsx
    doctor-profile-form.tsx
    availability-form.tsx
    availability-list.tsx

src/app/(app)/doctors/
  page.tsx
  new/page.tsx
  me/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx
```

---

## Architecture

```text
Route (RSC)
  → requireTenantContext([roles?])  // trusted tenantId
  → queries (tenant-scoped Prisma)
  → UI

Client form
  → Server Action
    → Zod validate
    → role + ownership checks
    → Prisma write (always with tenantId)
    → revalidatePath
```

### Authorization rules

1. Every doctor query filters by **`tenantId` from session membership** — never from the client.
2. Doctors may edit **only their own** profile/availability.
3. Admins may manage any doctor in the clinic.
4. Receptionists/patients get **read-only** access (needed for booking UX in Phase 7).

### Why availability is separate from appointments

Weekly templates (`DoctorAvailability`) describe recurring hours. Phase 7 will generate bookable slots from these templates and store concrete `Appointment` rows. Mixing both early creates messy schemas.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `admin@demo-clinic.local` / `DemoPass123!`
2. Open **Doctors** → view Dr. Dylan → add/edit availability
3. Sign in as `doctor@demo-clinic.local` → **My profile**
4. Confirm patient/reception can list doctors but cannot edit

Seed adds Mon/Wed/Fri slots for the demo doctor when missing.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Create doctor via Better Auth sign-up | Real login accounts immediately | Signup hook briefly creates PATIENT, then we upgrade role |
| Native `<select>` in forms | Stable with RHF | Slightly less polished than Base UI Select |
| Read-only for reception/patient | Ready for booking later | No “favorite doctor” yet |

---

## Common mistakes avoided

- Fetching doctors without `tenantId`
- Letting a doctor edit another doctor’s profile via forged IDs
- Putting availability CRUD in Client Components with direct Prisma
- Building full appointment booking inside Phase 5

---

## Phase gate

**Next:** Phase 6 — Patient Module  

Do **not** start Phase 6 until you explicitly approve Phase 5.
