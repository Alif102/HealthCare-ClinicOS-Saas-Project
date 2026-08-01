# Phase 11 — Billing

**Status:** Complete
**Scope:** Clinic invoices + manual payment recording — not Stripe/card gateways, insurance claims, or multi-line item catalogs

---

## What we built

| Capability | Who |
|------------|-----|
| List / filter invoices | ADMIN, RECEPTIONIST (clinic) · PATIENT (own) |
| Create / edit draft invoices | ADMIN, RECEPTIONIST |
| Issue / mark overdue / void | ADMIN, RECEPTIONIST |
| Record payments (partial → paid) | ADMIN, RECEPTIONIST |
| Optional 1:1 appointment link | Uses doctor `consultationFee` as suggested subtotal |
| View invoice + payment history | Same as list visibility |
| Doctor access | None (matches Phase 1 matrix) |

### Key files

```text
src/features/billing/
  money.ts
  schemas.ts
  constants.ts
  queries.ts
  actions.ts
  components/
    invoice-list.tsx
    invoice-form.tsx
    invoice-status-actions.tsx
    record-payment-form.tsx

src/app/(app)/billing/
  page.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx
```

---

## Architecture

```text
RSC list/detail
  → requireTenantContext([ADMIN, RECEPTIONIST, PATIENT])
  → tenant-scoped Prisma (+ patient ownership for PATIENT)

Forms / status / payment
  → Server Actions
  → Zod validate
  → staff-only writes
  → revalidatePath(/billing, appointment)
```

### Status workflow

```text
DRAFT → PENDING → PAID   (PAID set when payments cover total)
     ↘ VOID        ↘ OVERDUE → PAID / VOID
```

Invoice numbers: `INV-{year}-{####}` per tenant. Amounts use Prisma `Decimal`.

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Patients never see another patient’s invoices.
3. Only ADMIN / RECEPTIONIST create, edit, issue, void, or record payments.
4. Doctors are redirected away from `/billing` (clinical care, not front-desk cash).
5. Linked appointments must belong to the same tenant + patient and have no other invoice.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `reception@demo-clinic.local` / `DemoPass123!`
2. Open **Billing** → seeded PENDING invoice → **Record payment**
3. Or open an appointment → **Create invoice** → edit draft → **Issue invoice**
4. Sign in as `patient@demo-clinic.local` → **Billing** (view-only)
5. Confirm doctor cannot open `/billing`

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Manual payments only | No Stripe keys / ThemeForest buyer friction | No online “Pay now” |
| Flat subtotal + tax (no line items) | Matches schema; fast demo | Itemized superbills later |
| Receptionist full write access | Real front-desk loop | Finer ACLs later |
| Skip auto-overdue cron | No Redis/jobs | Staff marks OVERDUE |
| Doctor excluded from billing UI | Matches Phase 1 matrix | No “my revenue” for doctors yet |

---

## Common mistakes avoided

- Trusting client-supplied `tenantId` on invoice writes
- Letting patients invent payment records without a gateway
- Editing issued invoices (DRAFT-only edits)
- Over-recording payments past remaining balance
- Stuffing revenue charts into Reports (kept in Billing)

---

## Phase gate

**Next:** Phase 12 — Video Consultation — **started / complete** (see phase-12 doc)
