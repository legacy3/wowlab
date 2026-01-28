import { type Dictionary, insert, t } from "intlayer";

export default {
  content: {
    characterCard: {
      level: insert(
        t({
          de: "Stufe {{level}}",
          en: "Level {{level}}",
        }),
      ),
    },
    characterPanel: {
      importDifferentCharacter: t({
        de: "Anderen Charakter importieren",
        en: "Import different character",
      }),
    },
    configureStep: {
      back: t({ de: "Zurück", en: "Back" }),
      bloodlust: t({ de: "Kampfrausch", en: "Bloodlust" }),
      configureDescription: t({
        de: "Konfiguriere, wie die Simulation ausgeführt wird",
        en: "Configure how the simulation will run",
      }),
      fightLength: t({
        de: "Kampfdauer (Sek.)",
        en: "Fight Length (sec)",
      }),
      fightStyle: t({
        de: "Kampfstil",
        en: "Fight Style",
      }),
      foodAndFlask: t({
        de: "Essen & Fläschchen",
        en: "Food & Flask",
      }),
      iterations: t({ de: "Iterationen", en: "Iterations" }),
      optimalRaidBuffs: t({
        de: "Optimale Raidbuffs",
        en: "Optimal Raid Buffs",
      }),
      options: t({ de: "Optionen", en: "Options" }),
      runSimulation: t({
        de: "Simulation starten",
        en: "Run Simulation",
      }),
      select: t({ de: "Auswählen...", en: "Select..." }),
      simulationSettings: t({
        de: "Simulationseinstellungen",
        en: "Simulation Settings",
      }),
      targetCount: t({
        de: "Zielanzahl",
        en: "Target Count",
      }),
    },
    equipmentSlot: {
      back: t({ de: "Rücken", en: "Back" }),
      chest: t({ de: "Brust", en: "Chest" }),
      empty: t({ de: "Leer", en: "Empty" }),
      feet: t({ de: "Füße", en: "Feet" }),
      finger: insert(t({ de: "Finger {{n}}", en: "Finger {{n}}" })),
      hands: t({ de: "Hände", en: "Hands" }),
      head: t({ de: "Kopf", en: "Head" }),
      ilvl: insert(t({ de: "iLvl {{ilvl}}", en: "iLvl {{ilvl}}" })),
      legs: t({ de: "Beine", en: "Legs" }),
      mainHand: t({ de: "Waffenhand", en: "Main Hand" }),
      neck: t({ de: "Hals", en: "Neck" }),
      offHand: t({ de: "Schildhand", en: "Off Hand" }),
      shoulder: t({ de: "Schulter", en: "Shoulder" }),
      trinket: insert(t({ de: "Schmuck {{n}}", en: "Trinket {{n}}" })),
      waist: t({ de: "Taille", en: "Waist" }),
      wrist: t({ de: "Handgelenke", en: "Wrist" }),
    },
    importStep: {
      failedToParseSimCExport: t({
        de: "SimC-Export konnte nicht geparst werden",
        en: "Failed to parse SimC export",
      }),
      parsingSimCData: t({
        de: "SimC-Daten werden geparst...",
        en: "Parsing SimC data...",
      }),
    },
    parseStatus: {
      failedToParse: t({
        de: "Parsen fehlgeschlagen",
        en: "Failed to parse",
      }),
      parsedSuccessfully: t({
        de: "Erfolgreich geparst",
        en: "Parsed successfully",
      }),
      parsing: t({
        de: "Wird geparst...",
        en: "Parsing...",
      }),
    },
    recentProfiles: {
      continueSimulating: t({
        de: "Simulation fortsetzen",
        en: "Continue simulating",
      }),
      noRecent: t({
        de: "Keine kürzlichen Importe",
        en: "No recent imports",
      }),
      title: t({
        de: "Kürzliche Importe",
        en: "Recent imports",
      }),
    },
    resultsStep: {
      averageDps: t({ de: "Durchschnittliche DPS", en: "Average DPS" }),
      back: t({ de: "Zurück", en: "Back" }),
      chunks: t({ de: "Chunks", en: "Chunks" }),
      completed: insert(
        t({
          de: "{{iterations}} Iterationen abgeschlossen",
          en: "Completed {{iterations}} iterations",
        }),
      ),
      error: insert(t({ de: "Fehler: {{message}}", en: "Error: {{message}}" })),
      iterations: t({ de: "Iterationen", en: "Iterations" }),
      jobNotFound: t({ de: "Job nicht gefunden", en: "Job not found" }),
      loadingJob: t({ de: "Job wird geladen...", en: "Loading job..." }),
      maxDps: t({ de: "Max DPS", en: "Max DPS" }),
      minDps: t({ de: "Min DPS", en: "Min DPS" }),
      noResults: t({
        de: "Keine Ergebnisse verfügbar",
        en: "No results available",
      }),
      progress: t({ de: "Fortschritt", en: "Progress" }),
      progressIterations: insert(
        t({
          de: "{{completed}} / {{total}} Iterationen",
          en: "{{completed}} / {{total}} iterations",
        }),
      ),
      queued: t({
        de: "In Warteschlange, warte auf verfügbare Knoten...",
        en: "Queued, waiting for available nodes...",
      }),
      runAnother: t({ de: "Weitere starten", en: "Run Another" }),
      running: t({ de: "Läuft...", en: "Running..." }),
      simulationInProgress: t({
        de: "Simulation läuft...",
        en: "Simulation in progress...",
      }),
      simulationResults: t({
        de: "Simulationsergebnisse",
        en: "Simulation Results",
      }),
      waitingForNodes: t({
        de: "Warte auf Knoten...",
        en: "Waiting for nodes...",
      }),
      workInProgress: t({
        de: "In Arbeit...",
        en: "Work in progress...",
      }),
    },
    simcInput: {
      placeholder: t({
        de: "Füge deinen SimulationCraft-Export hier ein...",
        en: "Paste your SimulationCraft export here...",
      }),
    },
    wizard: {
      configure: t({ de: "Konfigurieren", en: "Configure" }),
      import: t({ de: "Importieren", en: "Import" }),
      results: t({ de: "Ergebnisse", en: "Results" }),
    },
  },
  description: "Content for simulation components.",
  key: "simulate",
  tags: ["simulate", "simulation"],
  title: "Simulate",
} satisfies Dictionary;
