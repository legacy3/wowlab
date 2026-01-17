import type { Metadata } from "next";

import { Roboto, Roboto_Mono } from "next/font/google";

import "@/styles/globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

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
    <html
      suppressHydrationWarning
      className={`${roboto.variable} ${robotoMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
