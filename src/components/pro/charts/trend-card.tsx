"use client";

/** From design-promax Charts/KPI-stats (9)__App.tsx TrendCard */
import { Card, Chip, cn } from "@heroui/react";
import { Icon } from "@iconify/react";

export type TrendCardProps = {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "neutral" | "negative";
  trendType?: "up" | "neutral" | "down";
  trendChipPosition?: "top" | "bottom";
  trendChipVariant?: "flat" | "light";
  className?: string;
};

export default function TrendCard({
  title,
  value,
  change,
  changeType = "neutral",
  trendType = "neutral",
  trendChipPosition = "top",
  trendChipVariant = "light",
  className,
}: TrendCardProps) {
  return (
    <Card
      className={cn(
        "relative border border-transparent dark:border-default-100",
        className,
      )}
      shadow="sm"
    >
      <div className="flex p-4">
        <div className="flex flex-col gap-y-2">
          <dt className="text-small font-medium text-default-500">{title}</dt>
          <dd className="text-2xl font-semibold text-default-700">{value}</dd>
        </div>
        {change != null && (
          <Chip
            className={cn("absolute right-4", {
              "top-4": trendChipPosition === "top",
              "bottom-4": trendChipPosition === "bottom",
            })}
            classNames={{
              content: "font-medium text-[0.65rem]",
            }}
            color={
              changeType === "positive"
                ? "success"
                : changeType === "neutral"
                  ? "warning"
                  : "danger"
            }
            radius="sm"
            size="sm"
            startContent={
              trendType === "up" ? (
                <Icon
                  height={12}
                  icon="solar:arrow-right-up-linear"
                  width={12}
                />
              ) : trendType === "neutral" ? (
                <Icon
                  height={12}
                  icon="solar:arrow-right-linear"
                  width={12}
                />
              ) : (
                <Icon
                  height={12}
                  icon="solar:arrow-right-down-linear"
                  width={12}
                />
              )
            }
            variant={trendChipVariant}
          >
            {change}
          </Chip>
        )}
      </div>
    </Card>
  );
}
