# Translations

Want to help translate WoW Lab? Contributions for any language are welcome.

## Editing translations

Each locale has a JSON file (`en.json`, `de.json`, etc). Just edit the values:

```json
{
  "MgvB1f": "Run quick simulations for your character",
  "eZSeUm": "Simulate"
}
```

Keys are auto-generated hashes. Match them to `en.json` and translate the values.

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

Use `useExtracted` to render messages in components:

```tsx
import { useExtracted } from "next-intl";

function MyComponent() {
  const t = useExtracted();
  return <h1>{t("Hello world")}</h1>;
}
```

See the [next-intl docs](https://next-intl.dev/docs/usage/extraction) for interpolation, plurals, and more.

## Guidelines

- Native speakers preferred
- Gaming terminology matters (this is a WoW theorycrafting app)
- Match the tone of existing translations
- A few keys done well beats everything done poorly

Skip the machine translation. Google Translate and ChatGPT produce awkward results, especially for gaming terms. If you're not fluent, that's fine. Someone else will pick it up.
