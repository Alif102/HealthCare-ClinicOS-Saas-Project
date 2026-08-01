import { redirect } from "next/navigation";

import { getPatientByUserId } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export default async function MyPatientProfilePage() {
  const { session, tenantId } = await requireTenantContext(["PATIENT"]);
  const patient = await getPatientByUserId(tenantId, session.user.id);

  if (!patient) {
    redirect("/dashboard");
  }

  redirect(`/patients/${patient.id}`);
}
