import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoAppointmentList } from "@/features/video/components/video-appointment-list";
import { listVideoAppointments } from "@/features/video/queries";
import { getDoctorByUserId } from "@/features/doctors/queries";
import { getPatientByUserId } from "@/features/patients/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Video",
};

export default async function VideoIndexPage() {
  const { session, membership, tenantId } = await requireTenantContext();

  let doctorProfileId: string | undefined;
  let patientProfileId: string | undefined;
  let title = "Video consultations";
  let description = "Clinic telehealth visits.";

  if (membership.role === "DOCTOR") {
    const me = await getDoctorByUserId(tenantId, session.user.id);
    if (!me) redirect("/doctors/me");
    doctorProfileId = me.id;
    title = "My video visits";
    description = "Telehealth appointments on your schedule.";
  }

  if (membership.role === "PATIENT") {
    const me = await getPatientByUserId(tenantId, session.user.id);
    if (!me) redirect("/patients/me");
    patientProfileId = me.id;
    title = "My video visits";
    description = "Join your telehealth appointments here.";
  }

  const appointments = await listVideoAppointments(tenantId, {
    doctorProfileId,
    patientProfileId,
  });

  return (
    <VideoAppointmentList
      appointments={appointments}
      title={title}
      description={description}
    />
  );
}
