import { type Dictionary, t } from "intlayer";

export default {
  content: {
    homePage: {
      hooksDescription: t({
        de: "Erkunde Spieldaten-Hooks für Zauber und Gegenstände.",
        en: "Explore game data hooks for spells and items.",
      }),
      hooksTitle: t({ de: "Hooks", en: "Hooks" }),
      rotationsDescription: t({
        de: "Erstelle und teile Rotation Priority Lists.",
        en: "Build and share rotation priority lists.",
      }),
      rotationsTitle: t({ de: "Rotations", en: "Rotations" }),
      simulateDescription: t({
        de: "Führe schnelle Simulationen für deinen Charakter aus.",
        en: "Run quick simulations for your character.",
      }),
      simulateTitle: t({ de: "Simulate", en: "Simulate" }),
    },
  },
  description: "Content for home page.",
  key: "home",
  tags: ["home"],
  title: "Home",
} satisfies Dictionary;
