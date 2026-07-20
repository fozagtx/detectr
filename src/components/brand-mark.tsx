"use client";

import { cn } from "@heroui/react";

type BrandMarkProps = {
  size?: number;
  className?: string;
  framed?: boolean;
};

export function BrandMark({ size = 40, className, framed = false }: BrandMarkProps) {
  if (framed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-medium border border-primary-100 bg-primary-50 p-1",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.svg"
          alt="Detectr"
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/favicon.svg"
      alt="Detectr"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
