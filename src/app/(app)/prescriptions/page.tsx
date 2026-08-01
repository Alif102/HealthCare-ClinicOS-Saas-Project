import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { PrescriptionStatus } from "@prisma/client";

import { PrescriptionList } from "@/features/prescriptions/components/prescription-list";
import { PRESCRIPTION_STATUS_OPTIONS } from "@/features/prescriptions/constants";
import { listPrescriptions } from "@/features/prescriptions/queries";
import { getDoctorByUserId } from "@/features/doctors/queries";
import { getPatientByUserId } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Prescriptions",
};

type PrescriptionsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value?: string): PrescriptionStatus | undefined {
  if (!value) return undefined;
  return PRESCRIPTION_STATUS_OPTIONS.includes(
    value as (typeof PRESCRIPTION_STATUS_OPTIONS)[number],
  )
    ? (value as PrescriptionStatus)
    : undefined;
}

export default async function PrescriptionsPage({
  searchParams,
}: PrescriptionsPageProps) {
  const params = await searchParams;
  const { session, membership, tenantId } = await requireTenantContext();
  const status = parseStatus(params.status);

  let doctorProfileId: string | undefined;
  let patientProfileId: string | undefined;
  let title = "Prescriptions";
  let description = "Clinic medication orders.";

  if (membership.role === "DOCTOR") {
    const me = await getDoctorByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/doctors/me");
    }
    doctorProfileId = me.id;
    title = "My prescriptions";
    description = "Orders you have written for clinic patients.";
  }

  if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    if (!me) {
      redirect("/patients/me");
    }
    patientProfileId = me.id;
    title = "My prescriptions";
    description = "Medications prescribed for you.";
  }

  const prescriptions = await listPrescriptions(tenantId, {
    status,
    doctorProfileId,
    patientProfileId,
  });

  return (
    <PrescriptionList
      prescriptions={prescriptions}
      canCreate={membership.role === "DOCTOR"}
      filters={{ status }}
      title={title}
      description={description}
    />
  );
}
