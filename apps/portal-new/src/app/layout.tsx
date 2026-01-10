import type { Metadata } from "next";

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
    <html lang="en">
      <body>
        <RefineProvider>{children}</RefineProvider>
      </body>
    </html>
  );
}
