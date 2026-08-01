import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { assertAiAssistAllowed } from "@/features/admin/queries";
import { AiDisclaimer } from "@/features/ai/components/ai-disclaimer";
import { AiPlayground } from "@/features/ai/components/ai-playground";
import { AI_DISCLAIMER } from "@/features/ai/constants";
import { activeAiProvider } from "@/features/ai/provider";
import { listAppointments } from "@/features/appointments/queries";
import { getDoctorByUserId } from "@/features/doctors/queries";
import { requireTenantContext } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "AI Assist",
};

export default async function AiAssistPage() {
  const { session, tenantId } = await requireTenantContext(["DOCTOR"]);
  const doctor = await getDoctorByUserId(tenantId, session.user.id);

  if (!doctor) {
    redirect("/doctors/me");
  }

  const aiEnabled = await assertAiAssistAllowed(tenantId);
  const upcoming = await listAppointments(tenantId, {
    doctorProfileId: doctor.id,
    take: 5,
  });
  const sample = upcoming[0] ?? null;
  const provider = activeAiProvider();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Assist</h1>
        <p className="mt-1 text-muted-foreground">
          Draft encounter notes and medication ideas from de-identified clinical
          labels — always clinician-reviewed.
        </p>
      </div>

      {!aiEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>AI assist is disabled</CardTitle>
            <CardDescription>
              An admin turned off AI features for this clinic.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ask a clinic admin to enable AI assist under Admin → Settings.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>
                Active provider: <span className="font-medium">{provider}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{AI_DISCLAIMER}</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Visit notes — open an appointment → Visit notes →{" "}
                  <strong className="font-medium text-foreground">
                    Draft assessment &amp; plan
                  </strong>
                </li>
                <li>
                  Prescriptions — on a draft Rx, add notes then{" "}
                  <strong className="font-medium text-foreground">
                    Suggest medications
                  </strong>
                </li>
                <li>
                  Without{" "}
                  <code className="text-foreground">OPENAI_API_KEY</code>, a
                  local template provider powers demos
                </li>
              </ul>
              <AiDisclaimer provider={provider} />
              {sample ? (
                <p>
                  Try notes on{" "}
                  <Link
                    href={`/appointments/${sample.id}/encounter`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    your next visit
                  </Link>
                  .
                </p>
              ) : (
                <p>
                  Book or open one of your appointments to use visit-note assist.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playground</CardTitle>
              <CardDescription>
                Uses your chart allergy/condition labels for the selected patient
                — never sends patient names to the model prompt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AiPlayground
                appointmentId={sample?.id ?? null}
                patientProfileId={sample?.patientProfileId ?? null}
                defaultHint={sample?.reason ?? "Mild cough for three days"}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
