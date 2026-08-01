import type { Metadata } from "next";

import { DoctorList } from "@/features/doctors/components/doctor-list";
import { listDoctors } from "@/features/doctors/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Doctors",
};

export default async function DoctorsPage() {
  const { membership, tenantId } = await requireTenantContext();
  const doctors = await listDoctors(tenantId);

  return (
    <DoctorList
      doctors={doctors}
      canCreate={membership.role === "ADMIN"}
    />
  );
}
