import type { NextLayoutIntlayer } from "next-intlayer";

import { configuration } from "intlayer";
import { IntlayerClientProvider } from "next-intlayer";
import { IntlayerServerProvider } from "next-intlayer/server";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/layout";
import { AppProviders } from "@/providers";

const { internationalization } = configuration;

export function generateStaticParams() {
  return internationalization.locales.map((locale) => ({ locale }));
}

const LocaleLayout: NextLayoutIntlayer = async ({ children, params }) => {
  const { locale } = await params;

  if (
    !internationalization.locales.includes(
      locale as (typeof internationalization.locales)[number],
    )
  ) {
    notFound();
  }

  return (
    <IntlayerServerProvider locale={locale}>
      <IntlayerClientProvider locale={locale}>
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </IntlayerClientProvider>
    </IntlayerServerProvider>
  );
};

export default LocaleLayout;
