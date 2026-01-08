import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { clsx } from "clsx";
import { SiteShell } from "@/components/layout";
import "./globals.scss";

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontSans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WoW Lab",
  description: "Simulation and theorycrafting tools for World of Warcraft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx(fontMono.variable, fontSans.variable)}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
