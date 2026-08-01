"use client";

import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/components/providers/store-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

/**
 * Client-only composition root. Keep this thin — add providers here,
 * not business logic.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoreProvider>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </StoreProvider>
  );
}
