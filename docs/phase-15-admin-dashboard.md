# Phase 15 — Admin Dashboard

**Status:** Complete (awaiting approval before Phase 16)  
**Scope:** Clinic settings, staff invite/membership controls, overview metrics, activity snapshot — not multi-clinic org trees, SSO, or immutable compliance audit logs

---

## What we built

| Capability | Who |
|------------|-----|
| Admin overview (counts + activity) | ADMIN |
| Clinic profile settings | ADMIN |
| AI assist tenant toggle | ADMIN |
| Invite admin / receptionist | ADMIN |
| Change staff role / suspend / activate | ADMIN |
| Doctor / patient memberships | View only (managed in their modules) |

### Key files

```text
src/features/admin/
  constants.ts
  settings.ts           # Tenant.settings helpers
  schemas.ts
  queries.ts
  actions.ts
  components/
    clinic-settings-form.tsx
    invite-staff-form.tsx
    membership-table.tsx

src/app/(app)/admin/
  page.tsx
  settings/page.tsx
  team/page.tsx
```

### Schema

`Tenant.settings` JSON — e.g. `{ "aiAssistEnabled": true }` (default enabled when unset).

Migration: `prisma/migrations/20260801132000_tenant_settings`

---

## Architecture

```text
/admin (ADMIN only)
  → overview queries (counts + recent appointments/invoices/memberships)
  → settings form → update Tenant + settings JSON
  → team → invite via Better Auth sign-up + membership upsert
         → role/status updates with last-admin + self-protection

AI actions
  → assertAiAssistAllowed(tenantId) before drafting
```

### Authorization rules

1. All admin routes/actions require **`ADMIN`** + trusted `tenantId`.
2. Cannot suspend yourself or demote yourself from ADMIN.
3. Cannot remove/suspend the **last active admin**.
4. Staff invite is **ADMIN / RECEPTIONIST** only — doctors/patients stay in their modules.
5. AI toggle is enforced server-side (not UI-only).

---

## How to try it

```bash
pnpm db:push   # if needed for Tenant.settings
pnpm db:seed
pnpm dev
```

1. Sign in as `admin@demo-clinic.local` / `DemoPass123!`
2. Open **Admin** — review metrics and activity
3. **Settings** — edit clinic profile; toggle AI assist off and confirm `/ai` blocks for doctors
4. **Team** — invite a receptionist or suspend a staff member (not yourself)

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| `settings` JSON vs many columns | Flexible flags without churn | Less typed at DB layer |
| Activity snapshot vs AuditLog table | Ships in one phase | Not immutable / incomplete |
| Staff invite ≠ doctor create | Clear module boundaries | Two entry points for “people” |
| ADMIN-only (no receptionist admin) | Matches Phase 1 matrix | Front desk cannot edit settings |

---

## Common mistakes avoided

- Letting any staff member change roles
- Allowing clinics with zero active admins
- Client-only AI disable without server checks
- Building a fake “audit log” that claims compliance completeness

---

## Upgrade path (later)

- Dedicated `AuditEvent` table with actor + entity + payload
- Email invites (Resend) instead of temporary passwords
- Per-role fine-grained permissions

---

## Phase gate

**Next:** Phase 16 — Testing & Optimization

Do **not** start the next phase until you explicitly approve Phase 15.
