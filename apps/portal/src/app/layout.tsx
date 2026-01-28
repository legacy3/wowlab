import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { Roboto, Roboto_Mono } from "next/font/google";

import { env } from "@/lib/env";
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
  metadataBase: new URL(env.APP_URL),
  openGraph: {
    locale: "en_US",
    siteName: "WoW Lab",
    type: "website",
  },
  title: {
    default: "WoW Lab",
    template: "%s | WoW Lab",
  },
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
