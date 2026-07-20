"use client";

import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <div className="light min-h-screen bg-white text-zinc-900">{children}</div>
    </HeroUIProvider>
  );
}
