import { type Dictionary, insert, t } from "intlayer";

export default {
  content: {
    articleMeta: {
      edit: t({ de: "Bearbeiten", en: "Edit" }),
      minRead: insert(
        t({
          de: "{{count}} Min. Lesezeit",
          en: "{{count}} min read",
        }),
      ),
    },
    articleSidebar: {
      minRead: insert(
        t({
          de: "{{count}} Min. Lesezeit",
          en: "{{count}} min read",
        }),
      ),
      navigation: t({ de: "Navigation", en: "Navigation" }),
      onThisPage: t({
        de: "Auf dieser Seite",
        en: "On this page",
      }),
      tableOfContents: t({
        de: "Inhaltsverzeichnis",
        en: "Table of contents",
      }),
    },
    mdHeading: {
      linkToSection: t({
        de: "Link zu diesem Abschnitt",
        en: "Link to this section",
      }),
    },
  },
  description: "Content for article and documentation components.",
  key: "article",
  tags: ["article", "docs", "markdown"],
  title: "Article",
} satisfies Dictionary;
