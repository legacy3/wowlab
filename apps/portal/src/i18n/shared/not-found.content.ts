import { type Dictionary, t } from "intlayer";

export default {
  content: {
    description: t({
      de: "Die Seite, die Sie suchen, existiert nicht oder wurde verschoben.",
      en: "The page you're looking for doesn't exist or has been moved.",
    }),
    goHome: t({
      de: "Zur Startseite",
      en: "Go home",
    }),
    pageNotFound: t({
      de: "Seite nicht gefunden",
      en: "Page not found",
    }),
  },
  description: "Content for the 404 not found page.",
  key: "not-found",
  tags: ["not-found", "404", "error"],
  title: "Not Found",
} satisfies Dictionary;
