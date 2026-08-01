import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PatientList } from "@/features/patients/components/patient-list";
import { getPatientByUserId, listPatients } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Patients",
};

type PatientsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const { q } = await searchParams;
  const { session, membership, tenantId } = await requireTenantContext();

  if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    redirect(me ? `/patients/${me.id}` : "/dashboard");
  }

  const patients = await listPatients(tenantId, q);

  return (
    <PatientList
      patients={patients}
      canCreate={
        membership.role === "ADMIN" || membership.role === "RECEPTIONIST"
      }
      search={q}
    />
  );
}
