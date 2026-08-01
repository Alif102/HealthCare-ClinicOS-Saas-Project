import { redirect } from "next/navigation";

import { getDoctorByUserId } from "@/features/doctors/queries";
import { requireTenantContext } from "@/lib/auth-session";

export default async function MyDoctorProfilePage() {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const doctor = await getDoctorByUserId(tenantId, session.user.id);

  if (!doctor) {
    redirect("/doctors");
  }

  redirect(`/doctors/${doctor.id}`);
}
