import { type Dictionary, t } from "intlayer";

export default {
  content: {
    entityDisplay: {
      enterId: t({ de: "ID eingeben", en: "Enter ID" }),
      loading: t({ de: "Wird geladen...", en: "Loading..." }),
      refresh: t({ de: "Aktualisieren", en: "Refresh" }),
    },
    i18nSection: {
      boldText: t({
        de: "Das ist <b>fetter</b> Text",
        en: "This is <b>bold</b> text",
      }),
      clickHere: t({
        de: "Klicke <b>hier</b> um <i>fortzufahren</i>",
        en: "Click <b>here</b> to <i>continue</i>",
      }),
      helloName: t({
        de: "Hallo, {name}!",
        en: "Hello, {name}!",
      }),
      inlineCode: t({
        de: "Das enthält <code>Inline-Code</code>",
        en: "This has <code>inline code</code>",
      }),
      italicText: t({
        de: "Das ist <i>kursiver</i> Text",
        en: "This is <i>italic</i> text",
      }),
      newMessages: t({
        de: "Du hast {count} neue Nachrichten",
        en: "You have {count} new messages",
      }),
      notifications: t({
        de: "Du hast <b>{count}</b> Benachrichtigungen",
        en: "You have <b>{count}</b> notifications",
      }),
      numberValue: t({
        de: "{value, number}",
        en: "{value, number}",
      }),
      percentValue: t({
        de: "{value, number, percent}",
        en: "{value, number, percent}",
      }),
      pluralItems: t({
        de: "{count, plural, =0 {Keine Elemente} =1 {Ein Element} other {# Elemente}}",
        en: "{count, plural, =0 {No items} =1 {One item} other {# items}}",
      }),
      price: t({
        de: "Preis: {price}",
        en: "Price: {price}",
      }),
      selectStatus: t({
        de: "{status, select, online {Online} offline {Offline} other {Unbekannt}}",
        en: "{status, select, online {Online} offline {Offline} other {Unknown}}",
      }),
      statusBadge: t({
        de: "Status: <badge>{status}</badge>",
        en: "Status: <badge>{status}</badge>",
      }),
      termsAndPrivacy: t({
        de: "Lies unsere <terms>Nutzungsbedingungen</terms> und <privacy>Datenschutzrichtlinie</privacy>",
        en: "Read our <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>",
      }),
      welcomeBack: t({
        de: "Willkommen zurück, <b>{name}</b>!",
        en: "Welcome back, <b>{name}</b>!",
      }),
    },
    searchDisplay: {
      empty: t({ de: "(leer)", en: "(empty)" }),
      loading: t({ de: "Wird geladen...", en: "Loading..." }),
      resultCount: t({
        de: "{count, plural, =1 {# Ergebnis} other {# Ergebnisse}}",
        en: "{count, plural, =1 {# result} other {# results}}",
      }),
      search: t({ de: "Suchen...", en: "Search..." }),
    },
  },
  description: "Content for dev/demo components.",
  key: "dev",
  tags: ["dev", "demo"],
  title: "Dev",
} satisfies Dictionary;
