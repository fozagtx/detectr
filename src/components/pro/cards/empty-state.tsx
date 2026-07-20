"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function EmptyState({
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
      className="border-small border-default-200 bg-content1"
      shadow="sm"
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
