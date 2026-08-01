# Phase 13 — Notifications

**Status:** Complete (awaiting approval before Phase 14)  
**Scope:** In-app notification inbox + optional Resend email — not push/SMS, digests, or full preference centers

---

## What we built

| Capability | Who |
|------------|-----|
| List own in-app notifications | All roles (own user only) |
| Mark one / mark all read | Own notifications |
| Unread badge in nav + dashboard | All roles |
| Domain event alerts | Triggered by other modules (see below) |
| Optional email via Resend | When `RESEND_API_KEY` is set |

### Domain events

| Event | Recipients |
|-------|------------|
| Appointment booked | Doctor + patient |
| Appointment status change | Other party (not the actor) |
| Invoice issued (`PENDING`) | Patient |
| Invoice fully paid | Patient |
| Prescription issued (`ACTIVE`) | Patient |
| Video room prepared | Doctor + patient (except actor) |

### Key files

```text
src/features/notifications/
  constants.ts
  schemas.ts
  email.ts              # optional Resend
  notify.ts             # create IN_APP (+ EMAIL)
  queries.ts
  actions.ts
  components/
    notification-list.tsx

src/app/(app)/notifications/
  page.tsx
```

---

## Architecture

```text
Domain Server Action succeeds
  → notifyUser({ tenantId, userId, title, body, event, href })
  → always write Notification (IN_APP)
  → if RESEND_API_KEY → send email + audit EMAIL row
  → never throw (domain must not fail on alert errors)

/notifications RSC
  → requireTenantContext()
  → list own IN_APP rows (tenant + user scoped)
```

### Authorization rules

1. Every query filters by **`tenantId` + `userId` from session**.
2. Users never read another user’s notifications.
3. `notifyUser` is server-only — clients cannot invent alerts for others.
4. Metadata may include `href` / event type — **no PHI** in titles beyond generic clinic language.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `patient@demo-clinic.local` / `DemoPass123!`
2. Open **Alerts** — seeded welcome + telehealth tip
3. As staff, book an appointment or issue an invoice → patient gets an unread alert
4. Mark read / mark all read

### Optional email

Add to `.env.local` (not required for demos):

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ClinicOS <onboarding@resend.dev>
```

Without the key, in-app still works (ThemeForest-friendly).

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Optional Resend | Demos without API keys | No email until configured |
| Sync notify in Server Actions | Simple; no Redis/queue | Slightly slower actions; no retries |
| Separate EMAIL audit rows | Traceability | Two rows when email enabled |
| Skip auth email verification | Keeps phase focused | Still optional later via Better Auth + Resend |

---

## Common mistakes avoided

- Letting clients create notifications for arbitrary user IDs
- Putting diagnosis / full chart notes in notification bodies
- Hard-requiring `RESEND_API_KEY` (would block ThemeForest buyers)
- Failing booking/billing when email send fails

---

## Upgrade path (later)

- Better Auth email verification / password reset via the same Resend helper
- Preference center (mute billing vs clinical)
- Reminder cron (appointment T-24h) — needs a scheduler, out of MVP

---

## Phase gate

**Next:** Phase 14 — AI Features

Do **not** start the next phase until you explicitly approve Phase 13.
