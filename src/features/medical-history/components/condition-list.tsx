"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteConditionAction } from "@/features/medical-history/actions";
import { ConditionForm } from "@/features/medical-history/components/condition-form";
import { CONDITION_STATUS_LABEL } from "@/features/medical-history/constants";

type ConditionRow = {
  id: string;
  name: string;
  status: string;
  diagnosedAt: Date | null;
  notes: string | null;
};

type ConditionListProps = {
  patientProfileId: string;
  conditions: ConditionRow[];
  canManage: boolean;
};

export function ConditionList({
  patientProfileId,
  conditions,
  canManage,
}: ConditionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const remove = (conditionId: string) => {
    startTransition(async () => {
      const result = await deleteConditionAction(conditionId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Condition removed");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conditions on file.</p>
      ) : (
        <ul className="space-y-3">
          {conditions.map((condition) => (
            <li
              key={condition.id}
              className="rounded-xl border border-border/70 px-4 py-3"
            >
              {editingId === condition.id ? (
                <ConditionForm
                  patientProfileId={patientProfileId}
                  conditionId={condition.id}
                  defaultValues={{
                    name: condition.name,
                    status:
                      (condition.status as keyof typeof CONDITION_STATUS_LABEL) ??
                      "active",
                    diagnosedAt: condition.diagnosedAt
                      ? condition.diagnosedAt.toISOString().slice(0, 10)
                      : "",
                    notes: condition.notes ?? "",
                  }}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{condition.name}</p>
                      <Badge variant="secondary">
                        {CONDITION_STATUS_LABEL[
                          condition.status as keyof typeof CONDITION_STATUS_LABEL
                        ] ?? condition.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {condition.diagnosedAt
                        ? `Diagnosed ${condition.diagnosedAt.toISOString().slice(0, 10)}`
                        : "Diagnosis date unknown"}
                      {condition.notes ? ` · ${condition.notes}` : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setEditingId(condition.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => remove(condition.id)}
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
            <ConditionForm
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
            Add condition
          </Button>
        )
      ) : null}
    </div>
  );
}
