import type { Metadata } from "next";
import {
  Anton,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Share_Tech_Mono,
} from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
/* design-promax skill: THEMES.json + themes.css */
import "../styles/pro-themes.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const brutalDisplay = Anton({
  variable: "--font-brutal-display",
  subsets: ["latin"],
  weight: "400",
});

const brutalBody = Share_Tech_Mono({
  variable: "--font-brutal-body",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Detectr",
  description:
    "See what witnesses said, what holds up, and how the scene likely looked.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="default-light"
      className={`light ${sans.variable} ${mono.variable} ${brutalDisplay.variable} ${brutalBody.variable}`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
