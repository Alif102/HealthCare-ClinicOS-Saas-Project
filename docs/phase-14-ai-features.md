# Phase 14 — AI Features

**Status:** Complete
**Scope:** Assistive drafts for encounter notes + prescription suggestions — not autonomous diagnosis, chatbots, or image/radiology AI

---

## What we built

| Capability | Who |
|------------|-----|
| Draft assessment & plan on visit notes | DOCTOR (own appointments) |
| Suggest medication lines on Rx form | DOCTOR |
| `/ai` playground + provider status | DOCTOR |
| Local template provider (no API key) | Default |
| Optional OpenAI chat completions | When `OPENAI_API_KEY` is set |

### Key files

```text
src/features/ai/
  constants.ts
  schemas.ts
  types.ts
  local.ts              # keyword templates
  openai.ts             # optional API
  provider.ts           # facade + fallback
  actions.ts
  components/
    ai-disclaimer.tsx
    draft-encounter-assist.tsx
    suggest-rx-assist.tsx
    ai-playground.tsx

src/app/(app)/ai/
  page.tsx
```

Wired into:

- `EncounterForm` — “Draft assessment & plan”
- `PrescriptionForm` — “Suggest medications”

---

## Architecture

```text
Doctor UI
  → Server Action (authz: DOCTOR + ownership)
  → load allergy/condition labels only (no patient name in prompt)
  → provider.generate*
       ├─ OPENAI_API_KEY → OpenAI JSON mode
       └─ else / on error → local templates
  → return draft → form setValue / replace (clinician edits)
```

### Authorization & safety rules

1. **DOCTOR only** — patients/staff cannot call AI actions.
2. Encounter drafts require **own appointment**.
3. Prompts use **labels** (allergen names, condition names, complaint text) — not patient identity fields.
4. Every UI surface shows the **assistive disclaimer**.
5. OpenAI failures **fall back to local** so demos never hard-fail.

---

## How to try it

```bash
pnpm db:seed
pnpm dev
```

1. Sign in as `doctor@demo-clinic.local` / `DemoPass123!`
2. Open **AI Assist** — try hint `cough` or `headache`
3. Or open an appointment → **Visit notes** → Draft assessment & plan
4. Or **Prescriptions → New** → notes like “mild cough” → Suggest medications

### Optional OpenAI

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional
```

Without the key, local templates still demo the full UX.

---

## Trade-offs

| Decision | Upside | Cost |
|----------|--------|------|
| Local + optional OpenAI | ThemeForest demos without keys | Templates are shallow |
| Assistive only (no auto-save) | Safer clinical boundary | Extra click for clinicians |
| No vector DB / RAG | Simple phase | No clinic knowledge base |
| Skip patient-facing AI chat | Clear liability boundary | No patient symptom checker |

---

## Common mistakes avoided

- Auto-issuing prescriptions from model output
- Sending full patient demographics / chart dumps to third parties
- Hard-requiring an API key for the phase to work
- Claiming diagnostic authority in UI copy

---

## Upgrade path (later)

- Structured SOAP with citations from prior encounters
- Formulary / interaction checks (non-LLM)
- Tenant-level “AI off” admin toggle (Phase 15)

---

## Phase gate

**Next:** Phase 16 — Testing & Optimization (after Phase 15)

Phase 15 — Admin Dashboard: see `docs/phase-15-admin-dashboard.md`.
