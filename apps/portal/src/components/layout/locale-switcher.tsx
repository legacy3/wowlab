"use client";

import { GlobeIcon } from "lucide-react";
import { useExtracted, useLocale } from "next-intl";

import { IconButton, Menu } from "@/components/ui";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, locales, routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useExtracted();
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton variant="plain" size="sm" aria-label={t("Change language")}>
          <GlobeIcon />
        </IconButton>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content minW="36">
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>{t("Language")}</Menu.ItemGroupLabel>
          </Menu.ItemGroup>
          {routing.locales.map((loc) => {
            const isActive = currentLocale === loc;

            return (
              <Menu.Item
                key={loc}
                value={loc}
                onClick={() => handleLocaleChange(loc)}
                fontWeight={isActive ? "medium" : "normal"}
                color={isActive ? "fg" : "fg.muted"}
              >
                {locales[loc]}
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
