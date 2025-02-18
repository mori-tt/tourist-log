"use client";

import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/Providers";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Providers>{children}</Providers>
    </SessionProvider>
  );
}
