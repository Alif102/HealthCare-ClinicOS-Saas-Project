"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const { error } = await authClient.signOut();
          if (error) {
            toast.error(error.message ?? "Unable to sign out");
            return;
          }
          router.push("/sign-in");
          router.refresh();
        });
      }}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
