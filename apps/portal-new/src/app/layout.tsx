import type { Metadata } from "next";

import { ThemeProvider } from "next-themes";

import { SiteShell } from "@/components/layout";
import { RefineProvider } from "@/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  description: "Simulation and theorycrafting tools for World of Warcraft",
  title: "WoW Lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class">
          <RefineProvider>
            <SiteShell>{children}</SiteShell>
          </RefineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
