"use client";

import { TopicsProvider } from "@/context/TopicsContext";
import { ArticlesProvider } from "@/context/ArticlesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TopicsProvider>
      <ArticlesProvider>{children}</ArticlesProvider>
    </TopicsProvider>
  );
}
