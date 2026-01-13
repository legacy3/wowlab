# Translations

Want to help translate WoW Lab? Contributions for any language are welcome.

## Editing translations

Each locale has a JSON file (`en.json`, `de.json`, etc). Just edit the values:

```json
{
  "Home": {
    "simulate": {
      "title": "Simulate",
      "description": "Run quick simulations for your character"
    }
  }
}
```

Keys stay in English. Only translate the values.

## Adding a new language

1. Copy `en.json` to `{locale}.json` (e.g. `fr.json`)
2. Translate the values
3. Register the locale in `src/i18n/routing.ts`:

```ts
export const locales = {
  en: "English",
  de: "Deutsch",
  fr: "Français", // add here
} as const;
```

The language picker updates automatically.

## Adding new keys (for devs)

Use `useTranslations` to render messages in components:

```tsx
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("Namespace");
  return <h1>{t("key")}</h1>;
}
```

Keys can be nested: `t("section.subsection.key")`. See the [next-intl docs](https://next-intl.dev/docs/usage/translations) for interpolation, plurals, and more.

## Guidelines

- Native speakers preferred
- Gaming terminology matters — this is a WoW theorycrafting app
- Match the tone of existing translations
- A few keys done well beats everything done poorly

Skip the machine translation. Google Translate and ChatGPT produce awkward results, especially for gaming terms. If you're not fluent, that's fine — someone else will pick it up.

## Questions

Open an issue on [GitHub](/go/github/issues) or ask on [Discord](/go/discord).
