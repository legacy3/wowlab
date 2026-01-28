# Translations

Want to help translate WoW Lab? Awesome.

## Quick Start

Find a content file and add your translation:

```ts
// Before
label: t({
  en: "Save",
}),

// After
label: t({
  de: "Speichern",
  en: "Save",
}),
```

## Patterns

**Simple text:**

```ts
label: t({
  de: "Einstellungen",
  en: "Settings",
}),
```

**Variables** with `insert()`:

```ts
greeting: insert(
  t({
    de: "Hallo, {{name}}!",
    en: "Hello, {{name}}!",
  }),
),
```

**Plurals** with `enu()`:

```ts
itemCount: enu({
  "1": t({
    de: "Ein Element",
    en: "One item",
  }),
  fallback: t({
    de: "Elemente",
    en: "items",
  }),
}),
```

## WoW Terms

Use official game translations where they exist. [Wowhead](https://de.wowhead.com) is your friend.

Keep technical terms in English: Action List, DPS, Rotation.

## Adding a Language

Add your locale to `intlayer.config.ts`:

```ts
locales: [Locales.ENGLISH, Locales.GERMAN, Locales.FRENCH],
```

Then add translations to the content files.

## Guidelines

Native speakers preferred. Please no machine translations. Google Translate and ChatGPT don't do well with gaming terms.

Partial translations are totally fine. A few keys done well beats everything done poorly. If you can't finish, no worries. Someone else will pick it up.

Thanks for helping make WoW Lab accessible to more players.

## Links

- [Intlayer Docs](https://intlayer.org/doc/concept/content)
