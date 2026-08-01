import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AllergyList } from "@/features/medical-history/components/allergy-list";
import { ConditionList } from "@/features/medical-history/components/condition-list";
import { EncounterSummary } from "@/features/medical-history/components/encounter-summary";
import { getPatientHistoryBundle } from "@/features/medical-history/queries";
import { requireTenantContext } from "@/lib/auth-session";

type PatientHistoryPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PatientHistoryPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Medical history · ${id.slice(0, 6)}` };
}

export default async function PatientHistoryPage({
  params,
}: PatientHistoryPageProps) {
  const { id } = await params;
  const { session, membership, tenantId } = await requireTenantContext();
  const bundle = await getPatientHistoryBundle(tenantId, id);

  if (!bundle.patient) {
    notFound();
  }

  if (
    membership.role === "PATIENT" &&
    bundle.patient.userId !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const canManage =
    membership.role === "ADMIN" ||
    membership.role === "RECEPTIONIST" ||
    membership.role === "DOCTOR" ||
    (membership.role === "PATIENT" &&
      bundle.patient.userId === session.user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/patients/${bundle.patient.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {bundle.patient.user.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Medical history
        </h1>
        <p className="text-sm text-muted-foreground">
          Allergies, conditions, and visit notes for{" "}
          {bundle.patient.user.name}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allergies</CardTitle>
            <CardDescription>
              Known allergens and reactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllergyList
              patientProfileId={bundle.patient.id}
              allergies={bundle.allergies}
              canManage={canManage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
            <CardDescription>
              Active, chronic, and resolved problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConditionList
              patientProfileId={bundle.patient.id}
              conditions={bundle.conditions}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit notes</CardTitle>
          <CardDescription>
            Encounter documentation linked to appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EncounterSummary encounters={bundle.encounters} />
        </CardContent>
      </Card>
    </div>
  );
}
