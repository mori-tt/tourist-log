"use client";

import { ArticlesProvider } from "@/context/ArticlesContext";
import { TopicsProvider } from "@/context/TopicsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ArticlesProvider>
      <TopicsProvider>{children}</TopicsProvider>
    </ArticlesProvider>
  );
}
