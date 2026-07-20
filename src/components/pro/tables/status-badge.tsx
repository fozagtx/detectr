"use client";

/** Adapted from design-promax Application/tables (1)__Status.tsx */
import { forwardRef, memo } from "react";
import { cn } from "@heroui/react";
import { SuccessCircleSvg } from "./success-circle";
import { WarningCircleSvg } from "./warning-circle";
import { DangerCircleSvg } from "./danger-circle";
import { DefaultCircleSvg } from "./default-circle";

export type StatusOption = "Likely" | "Unlikely" | "Unclear" | string;

const iconFor = (status: StatusOption) => {
  if (status === "Likely") return SuccessCircleSvg;
  if (status === "Unlikely") return DangerCircleSvg;
  if (status === "Unclear") return WarningCircleSvg;
  return DefaultCircleSvg;
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusOption;
}

export const StatusBadge = memo(
  forwardRef<HTMLDivElement, StatusBadgeProps>(function StatusBadge(
    { className, status, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-fit items-center gap-[2px] rounded-lg bg-default-100 px-2 py-1",
          className,
        )}
        {...props}
      >
        {iconFor(status)}
        <span className="px-1 text-default-800">{status}</span>
      </div>
    );
  }),
);

StatusBadge.displayName = "StatusBadge";
