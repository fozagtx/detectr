"use client";

/** Below-fold generate prompt — HeroUI Button chips + isIconOnly send + Make video */
import React from "react";
import { Button, cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import PromptInput from "./prompt-input";

const SUGGESTIONS = [
  "Oak Street at night",
  "Four witnesses",
  "Alley confrontation",
  "Scar under streetlight",
];

type LinkPromptProps = {
  value: string;
  onValueChange: (v: string) => void;
  onSend: () => void;
  onMakeVideo: () => void;
  isDisabled?: boolean;
  className?: string;
};

export default function LinkPrompt({
  value,
  onValueChange,
  onSend,
  onMakeVideo,
  isDisabled = false,
  className,
}: LinkPromptProps) {
  return (
    <div
      id="link-prompt"
      className={cn(
        "flex w-full flex-col gap-3 rounded-large border-small border-default-200 bg-content1 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button
            key={s}
            size="sm"
            radius="full"
            variant="flat"
            onPress={() => onValueChange(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <form
        className="flex w-full items-end gap-2 rounded-medium bg-default-100 p-2 transition-colors hover:bg-default-200/70"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim() || isDisabled) return;
          onSend();
        }}
      >
        <PromptInput
          classNames={{
            inputWrapper: "!bg-transparent shadow-none",
            input: "text-medium",
          }}
          minRows={1}
          maxRows={3}
          radius="lg"
          value={value}
          variant="flat"
          placeholder="Describe a scene to generate…"
          onValueChange={onValueChange}
          isDisabled={isDisabled}
        />
        <Button
          isIconOnly
          color={!value.trim() ? "default" : "primary"}
          isDisabled={!value.trim() || isDisabled}
          radius="full"
          size="md"
          type="submit"
          aria-label="Send"
          className="shrink-0"
        >
          <Icon
            className={
              !value.trim()
                ? "text-default-600"
                : "text-primary-foreground"
            }
            icon="solar:arrow-up-linear"
            width={20}
          />
        </Button>
      </form>

      <Button
        color="primary"
        radius="full"
        className="w-full sm:w-auto sm:self-end"
        startContent={
          <Icon icon="solar:videocamera-record-bold" width={18} />
        }
        isDisabled={isDisabled}
        onPress={onMakeVideo}
      >
        Make video
      </Button>
    </div>
  );
}
