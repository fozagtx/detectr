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
            background: "#FFFFFF",
            foreground: "#18181B",
            content1: "#FFFFFF",
            content2: "#F4F4F5",
            primary: {
              DEFAULT: "#0F8A52",
              foreground: "#FFFFFF",
              50: "#E8F7EF",
              100: "#C5ECD6",
              200: "#9BDFB9",
              300: "#6FD19A",
              400: "#3FBE76",
              500: "#0F8A52",
              600: "#0C7344",
              700: "#095C37",
              800: "#06452A",
              900: "#032E1C",
            },
            focus: "#0F8A52",
          },
        },
      },
    }),
  ],
};

export default config;
