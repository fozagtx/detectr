"use client";

/** Pro list card — CellWrapper + StatusBadge (cards 20 + tables 1) */
import { Card, CardBody, Chip, Progress, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import CellWrapper from "./cell-wrapper";
import { StatusBadge } from "../tables/status-badge";

export type ClaimCardProps = {
  title: string;
  subtitle?: string;
  body?: string;
  tags?: string[];
  status?: string;
  metric?: string;
  metricLabel?: string;
  progress?: number;
  className?: string;
  icon?: string;
};

export default function ClaimCard({
  title,
  subtitle,
  body,
  tags,
  status,
  metric,
  metricLabel,
  progress,
  className,
  icon = "solar:document-text-bold-duotone",
}: ClaimCardProps) {
  return (
    <Card
      className={cn("border-small border-default-200 bg-content1", className)}
      shadow="sm"
    >
      <CardBody className="gap-3 p-4">
        <CellWrapper className="bg-transparent p-0 shadow-none">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex shrink-0 rounded-medium border border-primary-100 bg-primary-50 p-2">
              <Icon className="text-primary" icon={icon} width={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-medium font-medium text-default-900">{title}</p>
              {subtitle && (
                <p className="text-small text-default-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {status && <StatusBadge status={status} />}
            {metric && (
              <div className="text-right">
                <p className="font-mono text-large font-semibold tabular-nums text-primary">
                  {metric}
                </p>
                {metricLabel && (
                  <p className="text-tiny text-default-400">{metricLabel}</p>
                )}
              </div>
            )}
          </div>
        </CellWrapper>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Chip key={t} size="sm" variant="flat">
                {t}
              </Chip>
            ))}
          </div>
        )}
        {body && (
          <p className="text-small leading-relaxed text-default-500">{body}</p>
        )}
        {typeof progress === "number" && (
          <Progress
            aria-label="Score"
            size="sm"
            color="primary"
            value={progress}
          />
        )}
      </CardBody>
    </Card>
  );
}
