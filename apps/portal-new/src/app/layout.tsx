import type { Metadata } from "next";

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
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
