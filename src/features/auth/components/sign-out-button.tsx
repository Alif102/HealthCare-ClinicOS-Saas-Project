"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      className={cn("w-full", className)}
      onClick={() => {
        startTransition(async () => {
          try {
            const { error } = await authClient.signOut();
            if (error) {
              toast.error(error.message ?? "Unable to sign out");
              return;
            }
          } catch {
            toast.error("Unable to sign out — check your connection and try again");
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
