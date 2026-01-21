import { type Dictionary, t } from "intlayer";

export default {
  content: {
    tryAgain: t({ de: "Erneut versuchen", en: "Try again" }),
  },
  description: "Localized strings for error pages.",
  key: "error",
  tags: ["error", "ui"],
  title: "Error",
} satisfies Dictionary;
