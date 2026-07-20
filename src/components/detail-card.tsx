"use client";

import { Button, Card, CardBody, Chip, Progress, cn } from "@heroui/react";
import { Icon } from "@iconify/react";

type DetailCardProps = {
  title: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  body?: string;
  tags?: string[];
  progress?: number;
  className?: string;
  onPress?: () => void;
};

/** Dense list card — GhostKeys SecretCodeCard pattern */
export function DetailCard({
  title,
  subtitle,
  metric,
  metricLabel,
  body,
  tags,
  progress,
  className,
  onPress,
}: DetailCardProps) {
  return (
    <Card
      isPressable={Boolean(onPress)}
      onPress={onPress}
      className={cn("border-small border-default-200 bg-content1", className)}
      shadow="sm"
    >
      <CardBody className="gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 rounded-medium border border-primary-100 bg-primary-50 p-2">
            <Icon
              className="text-primary"
              icon="solar:document-text-bold-duotone"
              width={20}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-medium font-medium text-default-900">
                  {title}
                </p>
                {subtitle && (
                  <p className="truncate text-small text-default-500">
                    {subtitle}
                  </p>
                )}
              </div>
              {metric && (
                <div className="shrink-0 text-right">
                  <p className="font-mono text-large font-semibold tabular-nums text-primary">
                    {metric}
                  </p>
                  {metricLabel && (
                    <p className="text-tiny text-default-400">{metricLabel}</p>
                  )}
                </div>
              )}
            </div>
            {tags && tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Chip key={t} size="sm" variant="flat">
                    {t}
                  </Chip>
                ))}
              </div>
            )}
            {body && (
              <p className="mt-2 text-small leading-relaxed text-default-500">
                {body}
              </p>
            )}
            {typeof progress === "number" && (
              <Progress
                aria-label="Score"
                size="sm"
                color="primary"
                value={progress}
                className="mt-3"
              />
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon = "solar:inbox-line-bold-duotone",
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <Card
      className="border-small border-dashed border-default-200 bg-content1"
      shadow="none"
    >
      <CardBody className="items-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-default-100">
          <Icon className="text-default-400" icon={icon} width={28} />
        </div>
        <div>
          <p className="text-medium font-medium text-default-700">{title}</p>
          <p className="mt-1 max-w-sm text-small text-default-500">{body}</p>
        </div>
        {actionLabel && onAction && (
          <Button
            color="primary"
            radius="full"
            startContent={<Icon icon="solar:play-bold" width={18} />}
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
