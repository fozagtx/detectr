import type { Metadata } from "next";
import { Anton, Share_Tech_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import "../styles/pro-themes.css";

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
      data-theme="brutalism-light"
      className={`light ${brutalDisplay.variable} ${brutalBody.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
