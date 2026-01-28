import { type Dictionary, t } from "intlayer";

export default {
  content: {
    loading: t({ de: "Laden...", en: "Loading..." }),
  },
  description: "Loading indicator text.",
  key: "loading",
  tags: ["loading", "ui"],
  title: "Loading",
} satisfies Dictionary;
