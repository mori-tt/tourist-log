"use client";

import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/Providers";
import { TopicsProvider } from "@/context/TopicsContext";
import { ArticlesProvider } from "@/context/ArticlesContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Providers>
        <TopicsProvider>
          <ArticlesProvider>{children}</ArticlesProvider>
        </TopicsProvider>
      </Providers>
    </SessionProvider>
  );
}
