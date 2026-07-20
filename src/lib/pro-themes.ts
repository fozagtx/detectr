/** Mirrors design-promax skill THEMES.json */
export const PRO_THEMES = [
  "default",
  "brutalism",
  "glass",
  "mouve",
] as const;

export type ProTheme = (typeof PRO_THEMES)[number];

export const PRO_THEME_LABELS: Record<ProTheme, string> = {
  default: "Default",
  brutalism: "Brutalism",
  glass: "Glass",
  mouve: "Mouve",
};

/** data-theme values from skill THEMES.json */
export const PRO_THEME_DATA: Record<ProTheme, string> = {
  default: "default-light",
  brutalism: "brutalism-light",
  glass: "glass-light",
  mouve: "mouve-light",
};

export const PRO_THEME_STORAGE_KEY = "detectr-pro-theme";

export function isProTheme(value: string | null | undefined): value is ProTheme {
  return PRO_THEMES.includes(value as ProTheme);
}
