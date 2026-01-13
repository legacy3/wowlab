# Translations

Want to help translate WoW Lab? Contributions for any language are welcome.

## Editing translations

Each locale has a PO file (`en.po`, `de.po`, etc). Edit the `msgstr` values:

```po
#: src/components/home/home-page.tsx:13
msgid "MgvB1f"
msgstr "Run quick simulations for your character"

#: src/components/home/home-page.tsx:15
msgid "eZSeUm"
msgstr "Simulate"
```

The `#:` comments show where each string is used. Keys are auto-generated hashes. Match them to `en.po` and translate the `msgstr` values.

## Adding a new language

1. Copy `en.po` to `{locale}.po` (e.g. `fr.po`)
2. Translate the `msgstr` values
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

### Numbers

Always use ICU plural format for numbers. Plain `{count}` won't pass type checks:

```tsx
// bad - type error
t("{count} items", { count: 5 });

// good - use plural format (# renders the number)
t("{count, plural, other {# items}}", { count: 5 });

// with singular/plural variants
t("{count, plural, =1 {# item} other {# items}}", { count });
```

### Rich text

Use `t.rich()` to embed components like links or icons:

```tsx
t.rich("Read our <link>terms</link>.", {
  link: (chunks) => <Link href="/terms">{chunks}</Link>,
});
```

### What not to translate

- Brand names (`WoW Lab`, `Discord`, etc.)
- Code/syntax examples
- Proper nouns

See the [next-intl docs](https://next-intl.dev/docs/usage/extraction) for more.

## Guidelines

- Native speakers preferred
- Gaming terminology matters (this is a WoW theorycrafting app)
- Match the tone of existing translations
- A few keys done well beats everything done poorly

Skip the machine translation. Google Translate and ChatGPT produce awkward results, especially for gaming terms. If you're not fluent, that's fine. Someone else will pick it up.
