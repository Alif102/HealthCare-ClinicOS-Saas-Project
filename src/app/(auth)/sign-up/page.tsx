import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Join the demo clinic as a patient to explore the portal."
    >
      <SignUpForm />
    </AuthShell>
  );
}
