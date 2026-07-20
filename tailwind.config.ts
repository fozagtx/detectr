import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "light",
      defaultExtendTheme: "light",
      themes: {
        light: {
          colors: {
            background: "#F4F4F5",
            foreground: "#18181B",
            content1: "#FFFFFF",
            content2: "#F4F4F5",
            // Forensic slate — Default theme (Mouve overrides via CSS)
            primary: {
              DEFAULT: "#1E293B",
              foreground: "#FFFFFF",
              50: "#F1F5F9",
              100: "#E2E8F0",
              200: "#CBD5E1",
              300: "#94A3B8",
              400: "#64748B",
              500: "#475569",
              600: "#334155",
              700: "#1E293B",
              800: "#0F172A",
              900: "#020617",
            },
            focus: "#1E293B",
          },
        },
      },
    }),
  ],
};

export default config;
