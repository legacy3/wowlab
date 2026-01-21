"use client";

import { configuration, getLocaleName } from "intlayer";
import { GlobeIcon } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";

import { IconButton, Menu } from "@/components/ui";

const { internationalization } = configuration;

export function LocaleSwitcher() {
  const { localeSwitcher: content } = useIntlayer("layout");

  const { locale: currentLocale, setLocale } = useLocale({
    onChange: "push",
  });

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="plain"
          size="sm"
          aria-label={content.changeLanguage.value}
        >
          <GlobeIcon />
        </IconButton>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content minW="36">
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel>{content.language}</Menu.ItemGroupLabel>
          </Menu.ItemGroup>
          {internationalization.locales.map((loc) => {
            const isActive = currentLocale === loc;

            return (
              <Menu.Item
                key={loc}
                value={loc}
                onClick={() => setLocale(loc)}
                fontWeight={isActive ? "medium" : "normal"}
                color={isActive ? "fg" : "fg.muted"}
              >
                {getLocaleName(loc)}
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
