import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { env } from "@/lib/env";

import { ThemeProvider, JotaiProvider, RefineProvider } from "@/providers";
import { SiteShell } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: "WoW Lab",
  description: "WoW rotation simulation toolkit for optimal DPS analysis",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <JotaiProvider>
            <RefineProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <SiteShell>{children}</SiteShell>
                <Toaster />
              </ThemeProvider>
            </RefineProvider>
          </JotaiProvider>
        </NuqsAdapter>
        <Analytics />
      </body>
    </html>
  );
}
