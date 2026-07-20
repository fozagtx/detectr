"use client";

import { cn } from "@heroui/react";

type LogoProps = {
  size?: number;
  className?: string;
  /** Show Detectr wordmark next to the mark */
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/** Detectr mark — brutal D + witness slit. No shield. */
export function Logo({
  size = 32,
  className,
  withWordmark = false,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt={withWordmark ? "" : "Detectr"}
        width={size}
        height={size}
        className="shrink-0"
      />
      {withWordmark && (
        <span
          className={cn(
            "text-small font-bold uppercase tracking-wide",
            wordmarkClassName,
          )}
        >
          Detectr
        </span>
      )}
    </span>
  );
}
