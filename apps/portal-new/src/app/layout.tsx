import type { Metadata } from "next";

import { clsx } from "clsx";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { SiteShell } from "@/components/layout";
import { RefineProvider } from "@/providers";
import "@/styles/globals.scss";

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  description: "Simulation and theorycrafting tools for World of Warcraft",
  icons: {
    apple: "/apple-icon.png",
    icon: [
      { type: "image/x-icon", url: "/favicon.ico" },
      { sizes: "16x16", type: "image/png", url: "/favicon-16x16.png" },
      { sizes: "32x32", type: "image/png", url: "/favicon-32x32.png" },
    ],
    other: [
      { rel: "icon", sizes: "192x192", url: "/icon-192.png" },
      { rel: "icon", sizes: "512x512", url: "/icon-512.png" },
    ],
  },
  title: "WoW Lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx(fontMono.variable, fontSans.variable)}>
        <RefineProvider>
          <SiteShell>{children}</SiteShell>
        </RefineProvider>
      </body>
    </html>
  );
}
