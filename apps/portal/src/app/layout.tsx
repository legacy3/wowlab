import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider, JotaiProvider } from "@/providers";
import { SiteShell } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { AuthSync } from "@/components/providers/auth-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WoW Lab",
  description: "WoW rotation simulation toolkit for optimal DPS analysis",
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
        <JotaiProvider>
          <AuthSync />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SiteShell>{children}</SiteShell>
            <Toaster />
          </ThemeProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
