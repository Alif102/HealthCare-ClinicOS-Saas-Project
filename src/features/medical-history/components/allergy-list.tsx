"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteAllergyAction } from "@/features/medical-history/actions";
import { AllergyForm } from "@/features/medical-history/components/allergy-form";
import { ALLERGY_SEVERITY_LABEL } from "@/features/medical-history/constants";

type AllergyRow = {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: string | null;
  notedAt: Date;
};

type AllergyListProps = {
  patientProfileId: string;
  allergies: AllergyRow[];
  canManage: boolean;
};

export function AllergyList({
  patientProfileId,
  allergies,
  canManage,
}: AllergyListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const remove = (allergyId: string) => {
    startTransition(async () => {
      const result = await deleteAllergyAction(allergyId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Allergy removed");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {allergies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No allergies on file.</p>
      ) : (
        <ul className="space-y-3">
          {allergies.map((allergy) => (
            <li
              key={allergy.id}
              className="rounded-xl border border-border/70 px-4 py-3"
            >
              {editingId === allergy.id ? (
                <AllergyForm
                  patientProfileId={patientProfileId}
                  allergyId={allergy.id}
                  defaultValues={{
                    allergen: allergy.allergen,
                    reaction: allergy.reaction ?? "",
                    severity:
                      (allergy.severity as keyof typeof ALLERGY_SEVERITY_LABEL) ??
                      "unknown",
                    notedAt: allergy.notedAt.toISOString().slice(0, 10),
                  }}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{allergy.allergen}</p>
                      {allergy.severity ? (
                        <Badge variant="outline">
                          {ALLERGY_SEVERITY_LABEL[
                            allergy.severity as keyof typeof ALLERGY_SEVERITY_LABEL
                          ] ?? allergy.severity}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {allergy.reaction || "No reaction noted"} ·{" "}
                      {allergy.notedAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setEditingId(allergy.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => remove(allergy.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        showForm ? (
          <div className="rounded-xl border border-dashed border-border/80 p-4">
            <AllergyForm
              patientProfileId={patientProfileId}
              onDone={() => setShowForm(false)}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            Add allergy
          </Button>
        )
      ) : null}
    </div>
  );
}
