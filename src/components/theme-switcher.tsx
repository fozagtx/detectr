"use client";

import { Tabs, Tab } from "@heroui/react";
import { PRO_THEME_LABELS, PRO_THEMES, type ProTheme } from "@/lib/pro-themes";
import { useProTheme } from "@/components/theme-provider";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useProTheme();

  return (
    <Tabs
      aria-label="Theme"
      size="sm"
      radius="full"
      variant="solid"
      selectedKey={theme}
      className={className}
      classNames={{
        tabList: "bg-default-100 gap-0.5 p-0.5",
        cursor: "bg-content1 shadow-sm",
        tab: "px-2.5 h-7",
        tabContent:
          "text-tiny font-medium group-data-[selected=true]:text-foreground",
      }}
      onSelectionChange={(key) => setTheme(String(key) as ProTheme)}
    >
      {PRO_THEMES.map((id) => (
        <Tab key={id} title={PRO_THEME_LABELS[id]} />
      ))}
    </Tabs>
  );
}
