import { type Dictionary, t } from "intlayer";

export default {
  content: {
    cpuCoresCard: {
      browsersLimitCores: t({
        de: "Browser können die gemeldeten Kerne begrenzen.",
        en: "Browsers may limit reported cores.",
      }),
      cpuCores: t({ de: "CPU-Kerne", en: "CPU Cores" }),
    },
    iterationsCard: {
      iterations: t({ de: "Iterationen", en: "Iterations" }),
    },
    jobHistoryCard: {
      actions: t({ de: "Aktionen", en: "Actions" }),
      all: t({ de: "Alle", en: "All" }),
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      cancelled: t({ de: "Abgebrochen", en: "Cancelled" }),
      cancelSimulation: t({
        de: "Simulation abbrechen",
        en: "Cancel simulation",
      }),
      casts: t({ de: "Casts", en: "Casts" }),
      close: t({ de: "Schließen", en: "Close" }),
      completed: t({ de: "Abgeschlossen", en: "Completed" }),
      dps: t({ de: "DPS", en: "DPS" }),
      duration: t({ de: "Dauer", en: "Duration" }),
      error: t({ de: "Fehler", en: "Error" }),
      failed: t({ de: "Fehlgeschlagen", en: "Failed" }),
      filterJobs: t({ de: "Jobs filtern...", en: "Filter jobs..." }),
      name: t({ de: "Name", en: "Name" }),
      noJobsMatchFilter: t({
        de: "Keine Jobs entsprechen dem aktuellen Filter",
        en: "No jobs match the current filter",
      }),
      noSimulationsYet: t({
        de: "Noch keine Simulationen",
        en: "No simulations yet",
      }),
      paused: t({ de: "Pausiert", en: "Paused" }),
      queued: t({ de: "In Warteschlange", en: "Queued" }),
      running: t({ de: "Läuft", en: "Running" }),
      simulationHistory: t({
        de: "Simulationsverlauf",
        en: "Simulation History",
      }),
      status: t({ de: "Status", en: "Status" }),
      totalDamage: t({ de: "Gesamtschaden", en: "Total Damage" }),
    },
    memoryCard: {
      memory: t({ de: "Speicher", en: "Memory" }),
    },
    simulationsCard: {
      simulations: t({ de: "Simulationen", en: "Simulations" }),
    },
    statusCard: {
      error: t({ de: "Fehler", en: "Error" }),
      ok: t({ de: "OK", en: "OK" }),
      status: t({ de: "Status", en: "Status" }),
    },
    workersCard: {
      workers: t({ de: "Workers", en: "Workers" }),
    },
  },
  description: "Content for computing dashboard.",
  key: "computing",
  tags: ["computing", "dashboard"],
  title: "Computing",
} satisfies Dictionary;
