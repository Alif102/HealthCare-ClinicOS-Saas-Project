"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { MembershipStatus, Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateMembershipAction } from "@/features/admin/actions";
import {
  ASSIGNABLE_STAFF_ROLES,
  MEMBERSHIP_STATUS_LABEL,
  ROLE_LABEL,
} from "@/features/admin/constants";

type MembershipRow = {
  id: string;
  role: Role;
  status: MembershipStatus;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type MembershipTableProps = {
  memberships: MembershipRow[];
  currentUserId: string;
};

function statusVariant(
  status: MembershipStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "SUSPENDED":
      return "destructive";
    case "INVITED":
      return "outline";
    default:
      return "secondary";
  }
}

export function MembershipTable({
  memberships,
  currentUserId,
}: MembershipTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (input: {
    membershipId: string;
    role?: "ADMIN" | "RECEPTIONIST";
    status?: MembershipStatus;
  }) => {
    startTransition(async () => {
      const result = await updateMembershipAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Membership updated");
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((row) => {
            const isSelf = row.userId === currentUserId;
            const isStaff =
              row.role === "ADMIN" || row.role === "RECEPTIONIST";

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{row.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.user.email}
                      {isSelf ? " · you" : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{ROLE_LABEL[row.role]}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>
                    {MEMBERSHIP_STATUS_LABEL[row.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isStaff ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      {ASSIGNABLE_STAFF_ROLES.filter(
                        (role) => role !== row.role,
                      ).map((role) => (
                        <Button
                          key={role}
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            run({ membershipId: row.id, role })
                          }
                        >
                          Make {ROLE_LABEL[role]}
                        </Button>
                      ))}
                      {row.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={isPending || isSelf}
                          onClick={() =>
                            run({
                              membershipId: row.id,
                              status: "SUSPENDED",
                            })
                          }
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            run({
                              membershipId: row.id,
                              status: "ACTIVE",
                            })
                          }
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Managed in {row.role === "DOCTOR" ? "Doctors" : "Patients"}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
