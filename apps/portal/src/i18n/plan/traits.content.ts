import { type Dictionary, t } from "intlayer";

export default {
  content: {
    calculator: {
      close: t({ de: "Schließen", en: "Close" }),
    },
    debugModal: {
      browse: t({ de: "Durchsuchen", en: "Browse" }),
      close: t({ de: "Schließen", en: "Close" }),
      debugTools: t({ de: "Debug-Werkzeuge", en: "Debug Tools" }),
      description: t({
        de: "Trait-Baumdaten und Zauberbeschreibungen untersuchen",
        en: "Inspect trait tree data and spell descriptions",
      }),
      export: t({ de: "Exportieren", en: "Export" }),
      treeData: t({ de: "Baumdaten", en: "Tree Data" }),
    },
    errorPage: {
      backToStart: t({ de: "Zurück zum Start", en: "Back to start" }),
      invalidLoadoutDescription: t({
        de: "Der angegebene Loadout-String konnte nicht dekodiert werden.",
        en: "The provided loadout string could not be decoded.",
      }),
      invalidLoadoutString: t({
        de: "Ungültiger Loadout-String",
        en: "Invalid loadout string",
      }),
    },
    pointCounter: {
      class: t({ de: "Klasse", en: "Class" }),
      hero: t({ de: "Held", en: "Hero" }),
    },
    startScreen: {
      chooseClassAndSpec: t({
        de: "Wähle eine Klasse und Spezialisierung",
        en: "Choose a class and specialization",
      }),
      importTraitString: t({
        de: "Trait-String importieren",
        en: "Import Trait String",
      }),
      load: t({ de: "Laden", en: "Load" }),
      or: t({ de: "oder", en: "or" }),
      pasteATraitString: t({
        de: "Füge einen Talent-String ein...",
        en: "Paste a talent string ...",
      }),
      pasteLoadoutStringDescription: t({
        de: "Füge einen Talent-Loadout-String ein, um ihn anzuzeigen und zu bearbeiten",
        en: "Paste a talent loadout string to view and edit",
      }),
      planYourBuild: t({
        de: "Plane den Trait-Build deines Charakters",
        en: "Plan your character's trait build",
      }),
      startFromScratch: t({ de: "Neu beginnen", en: "Start from Scratch" }),
      traitCalculator: t({ de: "Trait-Rechner", en: "Trait Calculator" }),
    },
    toolbar: {
      exportPng: t({ de: "Als PNG exportieren", en: "Export PNG" }),
      pan: t({ de: "Schwenken (Leertaste / H)", en: "Pan (Space / H)" }),
      redo: t({ de: "Wiederholen (Cmd+Shift+Z)", en: "Redo (Cmd+Shift+Z)" }),
      resetView: t({ de: "Ansicht zurücksetzen (0)", en: "Reset View (0)" }),
      select: t({ de: "Auswählen (V)", en: "Select (V)" }),
      shareLink: t({ de: "Link teilen", en: "Share Link" }),
      undo: t({ de: "Rückgängig (Cmd+Z)", en: "Undo (Cmd+Z)" }),
      zoomIn: t({ de: "Vergrößern (+)", en: "Zoom In (+)" }),
      zoomOut: t({ de: "Verkleinern (-)", en: "Zoom Out (-)" }),
      zoomToFit: t({ de: "Einpassen (Cmd+0)", en: "Zoom to Fit (Cmd+0)" }),
    },
    tooltip: {
      clickToAddRank: t({
        de: "Klicken, um Rang hinzuzufügen, Rechtsklick zum Erstatten",
        en: "Click to add rank, right-click to refund",
      }),
      clickToPurchase: t({ de: "Klicken zum Kaufen", en: "Click to purchase" }),
      rank: t({ de: "Rang", en: "Rank" }),
      rightClickToRefund: t({
        de: "Rechtsklick zum Erstatten",
        en: "Right-click to refund",
      }),
    },
  },
  description: "Content for the trait calculator page.",
  key: "traits",
  tags: ["traits", "plan", "calculator"],
  title: "Traits",
} satisfies Dictionary;
