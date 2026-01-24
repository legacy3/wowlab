import { type Dictionary, t } from "intlayer";

export default {
  content: {
    appSidebar: {
      misc: t({ de: "Sonstiges", en: "Misc" }),
      preview: t({ de: "V", en: "P" }),
      toolkit: t({ de: "Toolkit", en: "Toolkit" }),
    },
    computingDrawer: {
      active: t({ de: "Aktiv", en: "Active" }),
      close: t({ de: "Schließen", en: "Close" }),
      computing: t({ de: "Computing", en: "Computing" }),
      dashboard: t({ de: "Dashboard", en: "Dashboard" }),
      noActiveSimulations: t({
        de: "Keine aktiven Simulationen",
        en: "No active simulations",
      }),
      noSimulationsYet: t({
        de: "Noch keine Simulationen",
        en: "No simulations yet",
      }),
      recent: t({ de: "Zuletzt", en: "Recent" }),
      runSimulationToSee: t({
        de: "Starte eine Simulation, um den Fortschritt hier zu sehen.",
        en: "Run a simulation to see progress here.",
      }),
      simulationRunning: t({
        de: "Simulation läuft",
        en: "simulation running",
      }),
      simulationsRunning: t({
        de: "Simulationen laufen",
        en: "simulations running",
      }),
    },
    localeSwitcher: {
      changeLanguage: t({
        de: "Sprache ändern",
        en: "Change language",
      }),
      language: t({ de: "Sprache", en: "Language" }),
    },
    navbar: {
      closeMenu: t({
        de: "Menü schließen",
        en: "Close menu",
      }),
      computing: t({ de: "Computing", en: "Computing" }),
      openComputingDrawer: t({
        de: "Computing öffnen",
        en: "Open computing drawer",
      }),
      openMenu: t({ de: "Menü öffnen", en: "Open menu" }),
    },
    themeToggle: {
      dark: t({ de: "Dunkel", en: "Dark" }),
      light: t({ de: "Hell", en: "Light" }),
      system: t({ de: "System", en: "System" }),
      themeLabel: t({ de: "Design:", en: "Theme:" }),
      toggleTheme: t({
        de: "Design wechseln",
        en: "Toggle theme",
      }),
    },
    userMenu: {
      account: t({ de: "Konto", en: "Account" }),
      nodes: t({ de: "Nodes", en: "Nodes" }),
      settings: t({ de: "Einstellungen", en: "Settings" }),
      signOut: t({ de: "Abmelden", en: "Sign out" }),
    },
  },
  description: "Content for layout components.",
  key: "layout",
  tags: ["layout", "navigation"],
  title: "Layout",
} satisfies Dictionary;
