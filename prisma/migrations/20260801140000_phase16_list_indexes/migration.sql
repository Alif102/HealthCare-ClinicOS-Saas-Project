-- Phase 16: indexes for common list / report sort filters
CREATE INDEX IF NOT EXISTS "doctor_profile_tenantId_createdAt_idx" ON "doctor_profile"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "patient_profile_tenantId_createdAt_idx" ON "patient_profile"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "appointment_tenantId_type_startAt_idx" ON "appointment"("tenantId", "type", "startAt");
CREATE INDEX IF NOT EXISTS "encounter_tenantId_createdAt_idx" ON "encounter"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "prescription_tenantId_status_idx" ON "prescription"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "prescription_tenantId_createdAt_idx" ON "prescription"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "invoice_tenantId_createdAt_idx" ON "invoice"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "tenant_membership_tenantId_status_idx" ON "tenant_membership"("tenantId", "status");
