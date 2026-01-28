import { type Dictionary, t } from "intlayer";

export default {
  content: {
    jobHistoryCard: {
      all: t({ de: "Alle", en: "All" }),
      chunks: t({ de: "Chunks", en: "Chunks" }),
      close: t({ de: "Schließen", en: "Close" }),
      completed: t({ de: "Abgeschlossen", en: "Completed" }),
      created: t({ de: "Erstellt", en: "Created" }),
      dps: t({ de: "DPS", en: "DPS" }),
      dpsRange: t({ de: "DPS-Bereich", en: "DPS Range" }),
      iterations: t({ de: "Iterationen", en: "Iterations" }),
      jobDetails: t({ de: "Job-Details", en: "Job Details" }),
      jobId: t({ de: "Job-ID", en: "Job ID" }),
      meanDps: t({ de: "Mittlere DPS", en: "Mean DPS" }),
      noJobsMatchFilter: t({
        de: "Keine Jobs entsprechen dem aktuellen Filter",
        en: "No jobs match the current filter",
      }),
      noSimulationsYet: t({
        de: "Noch keine Simulationen",
        en: "No simulations yet",
      }),
      pending: t({ de: "Ausstehend", en: "Pending" }),
      progress: t({ de: "Fortschritt", en: "Progress" }),
      running: t({ de: "Läuft", en: "Running" }),
      simulationHistory: t({
        de: "Simulationsverlauf",
        en: "Simulation History",
      }),
      status: t({ de: "Status", en: "Status" }),
    },
  },
  description: "Content for computing dashboard.",
  key: "computing",
  tags: ["computing", "dashboard"],
  title: "Computing",
} satisfies Dictionary;
