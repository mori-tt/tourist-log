"use client";

import { TopicsProvider } from "@/context/TopicsContext";
import { ArticlesProvider } from "@/context/ArticlesContext";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TopicsProvider>
      <ArticlesProvider>
        {children}
        <Toaster />
      </ArticlesProvider>
    </TopicsProvider>
  );
}
