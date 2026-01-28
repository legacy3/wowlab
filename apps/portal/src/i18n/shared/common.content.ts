import { type Dictionary, t } from "intlayer";

export default {
  content: {
    pageHeader: {
      previewBadge: t({ de: "Vorschau", en: "Preview" }),
      previewTooltip: t({
        de: "Diese Funktion befindet sich in aktiver Entwicklung",
        en: "This feature is in active development",
      }),
    },
  },
  description: "Common UI components content.",
  key: "common",
  tags: ["common", "ui"],
  title: "Common",
} satisfies Dictionary;
