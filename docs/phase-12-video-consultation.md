# Phase 12 — Video Consultation

**Status:** Complete (awaiting approval before Phase 13)  
**Scope:** Auth-gated video rooms for `VIDEO` appointments — not a full telehealth marketplace, recording, or HIPAA BAA video vendor contract

---

## What we built

| Capability | Who |
|------------|-----|
| List video appointments | All roles (scoped: doctor/patient own; staff clinic) |
| Prepare consultation room | ADMIN, RECEPTIONIST, DOCTOR (own visit) |
| Join in-app room (Jitsi embed) | Doctor + patient of visit · staff oversight |
| Open room in new tab | Same as join |
| Start session (timestamp + optional IN_PROGRESS) | On first join |
| End session (optional COMPLETED) | ADMIN, RECEPTIONIST, DOCTOR (own) |
| Patients prepare rooms | No |

### Key files

```text
src/features/video/
  provider.ts          # Jitsi URL + opaque room names
  constants.ts
  schemas.ts
  queries.ts
  actions.ts
  components/
    video-room.tsx
    video-session-actions.tsx
    video-appointment-list.tsx

src/app/(app)/video/
  page.tsx
  [id]/page.tsx
```

---

## Architecture

```text
VIDEO appointment
  → createConsultationSession (roomName + joinUrl)
  → /video/[id] auth gate
  → Jitsi iframe embed (meet.jit.si)
  → start on join · end closes room
```

### Provider choice — Jitsi (no API key)

| Option | ThemeForest fit | Cost |
|--------|-----------------|------|
| **Jitsi Meet public** (chosen) | Zero env secrets; buyers run demos immediately | Public server; not a BAA |
| Daily.co / Agora | Better production controls | Requires API keys (env gate) |

Opaque room names (`clinicos-…`) — never patient names or IDs.

### Authorization rules

1. Every query filters by **`tenantId` from session**.
2. Only `AppointmentType.VIDEO` can get a `ConsultationSession`.
3. Patients join own visits only; they cannot create rooms.
4. Join page redirects strangers (wrong doctor/patient) away.
5. Ending a **LIVE** / in-progress visit can mark the appointment **COMPLETED**.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `doctor@demo-clinic.local` / `DemoPass123!`
2. Open **Video** → seeded telehealth visit → **Join**
3. Or open the VIDEO appointment → session controls
4. Sign in as `patient@demo-clinic.local` → join the same room
5. Doctor/staff → **End session**

Allow camera/mic when the browser prompts (Jitsi iframe).

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Jitsi public embed | No `DAILY_API_KEY` gate | Shared public infra; swap later |
| VIDEO-type only | Clear product boundary | In-person visits stay in-clinic |
| Auto IN_PROGRESS on join | Matches real telehealth flow | Staff may prefer manual status |
| No recording / waiting room API | Thin phase | Richer telehealth later |

---

## Common mistakes avoided

- Putting PHI in room names or public URLs
- Letting any logged-in user join any room by guessing IDs (authz on session + appointment ownership)
- Requiring payment-gateway-style secrets for a ThemeForest demo
- Building a custom WebRTC stack from scratch

---

## Upgrade path (later)

When you want a signed BAA / private rooms, introduce `DAILY_API_KEY` (or similar) behind `src/features/video/provider.ts` without changing the `ConsultationSession` schema.

---

## Phase gate

**Next:** Phase 13 — Notifications

Do **not** start the next phase until you explicitly approve Phase 12.
