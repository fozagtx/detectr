"use client";

import React from "react";
import { Button, Tooltip, ScrollShadow, cn } from "@heroui/react";
import { Icon } from "@iconify/react";

import PromptInput from "./prompt-input";

export type PromptIdea = {
  title: string;
  description?: string;
};

type PromptComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  ideas?: PromptIdea[];
  isDisabled?: boolean;
  placeholder?: string;
  maxLength?: number;
};

/** HeroUI Pro prompt-input-with-bottom-actions, wired for Detectr Ask. */
export default function PromptComposer({
  value,
  onValueChange,
  onSubmit,
  ideas = [],
  isDisabled = false,
  placeholder = "Ask about this case…",
  maxLength = 2000,
}: PromptComposerProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {ideas.length > 0 && (
        <ScrollShadow
          hideScrollBar
          className="flex flex-nowrap gap-2"
          orientation="horizontal"
        >
          <div className="flex gap-2">
            {ideas.map(({ title, description }, index) => (
              <Button
                key={index}
                className="flex h-14 flex-col items-start gap-0"
                variant="flat"
                onPress={() => onValueChange(title)}
              >
                <p>{title}</p>
                {description ? (
                  <p className="text-default-500">{description}</p>
                ) : null}
              </Button>
            ))}
          </div>
        </ScrollShadow>
      )}
      <form
        className="flex w-full flex-col items-start rounded-medium bg-default-100 transition-colors hover:bg-default-200/70"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim() || isDisabled) return;
          onSubmit();
        }}
      >
        <PromptInput
          classNames={{
            inputWrapper: "!bg-transparent shadow-none",
            innerWrapper: "relative",
            input: "pt-1 pl-2 pb-6 !pr-10 text-medium",
          }}
          endContent={
            <div className="flex items-end gap-2">
              <Tooltip showArrow content="Send message">
                <Button
                  isIconOnly
                  color={!value ? "default" : "primary"}
                  isDisabled={!value.trim() || isDisabled}
                  radius="lg"
                  size="sm"
                  variant="solid"
                  type="submit"
                  aria-label="Send"
                >
                  <Icon
                    className={cn(
                      "[&>path]:stroke-[2px]",
                      !value
                        ? "text-default-600"
                        : "text-primary-foreground",
                    )}
                    icon="solar:arrow-up-linear"
                    width={20}
                  />
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius="lg"
          value={value}
          variant="flat"
          placeholder={placeholder}
          onValueChange={onValueChange}
          isDisabled={isDisabled}
        />
        <div className="flex w-full items-center justify-between gap-2 overflow-scroll px-4 pb-4">
          <div className="flex w-full gap-1 md:gap-3">
            <Button
              size="sm"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:notes-linear"
                  width={18}
                />
              }
              variant="flat"
              onPress={() =>
                onValueChange("What did everyone agree on?")
              }
            >
              Agreements
            </Button>
            <Button
              size="sm"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:danger-triangle-linear"
                  width={18}
                />
              }
              variant="flat"
              onPress={() =>
                onValueChange("Why was something hard to believe?")
              }
            >
              Weak spots
            </Button>
          </div>
          <p className="py-1 text-tiny text-default-400">
            {value.length}/{maxLength}
          </p>
        </div>
      </form>
    </div>
  );
}
