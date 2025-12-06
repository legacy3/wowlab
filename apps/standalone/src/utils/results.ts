import * as Effect from "effect/Effect";

export interface AggregatedStats {
  completedSims: number;
  totalCasts: number;
}

export interface SimResult {
  casts: number;
  duration: number;
  simId: number;
}

interface ResultsBoxMetrics {
  avgCasts: string;
  duration: string;
  elapsed: string;
  engine?: { clamp?: boolean; label: string; value: string };
  iterations: string;
  throughput: string;
  totalCasts: string;
}

const LABEL_WIDTH = 15;
const VALUE_WIDTH = 20;
const BOX_BORDER_TOP = "┌─────────────────────────────────────────┐";
const BOX_BORDER_BOTTOM = "└─────────────────────────────────────────┘";
const BOX_DIVIDER = "├─────────────────────────────────────────┤";
const BOX_TITLE = "│           Simulation Results            │";

const formatLabel = (label: string): string => `${label}:`.padEnd(LABEL_WIDTH);
const formatValue = (value: string): string => value.padStart(VALUE_WIDTH);
const formatValueClamped = (value: string): string =>
  value.padStart(VALUE_WIDTH).slice(-VALUE_WIDTH);
const formatRow = (label: string, value: string): string =>
  `│  ${formatLabel(label)}${value}  │`;

const wrapBox = (rows: readonly string[]): readonly string[] => [
  "",
  BOX_BORDER_TOP,
  BOX_TITLE,
  BOX_DIVIDER,
  ...rows,
  BOX_BORDER_BOTTOM,
];

const logBox = (rows: readonly string[]): Effect.Effect<void> =>
  Effect.gen(function* () {
    for (const line of wrapBox(rows)) {
      yield* Effect.log(line);
    }
  });

const printResultsBox = (metrics: ResultsBoxMetrics): Effect.Effect<void> => {
  const rows: string[] = [
    formatRow("Iterations", formatValue(metrics.iterations)),
    formatRow("Duration", formatValue(metrics.duration)),
    formatRow("Elapsed", formatValue(metrics.elapsed)),
  ];

  if (metrics.engine) {
    const value = metrics.engine.clamp
      ? formatValueClamped(metrics.engine.value)
      : formatValue(metrics.engine.value);
    rows.push(formatRow(metrics.engine.label, value));
  }

  rows.push(BOX_DIVIDER);
  rows.push(formatRow("Total Casts", formatValue(metrics.totalCasts)));
  rows.push(formatRow("Avg Casts", formatValue(metrics.avgCasts)));
  rows.push(formatRow("Throughput", formatValue(metrics.throughput)));

  return logBox(rows);
};

const fmt = (n: number): string => n.toLocaleString();

export const printResults = (
  results: SimResult[],
  elapsed: number,
  workerCount?: number,
): Effect.Effect<void> => {
  const iterations = results.length;
  const totalCasts = results.reduce((sum, r) => sum + r.casts, 0);
  const avgCasts = totalCasts / iterations;
  const throughput = (iterations / elapsed) * 1000;

  return printResultsBox({
    avgCasts: avgCasts.toFixed(1),
    duration: `${results[0].duration}s`,
    elapsed: `${elapsed.toFixed(1)}ms`,
    engine:
      workerCount && workerCount > 0
        ? { label: "Workers", value: String(workerCount) }
        : undefined,
    iterations: String(iterations),
    throughput: `${throughput.toFixed(1)} sims/s`,
    totalCasts: String(totalCasts),
  });
};

export const printAggregatedResults = (
  stats: AggregatedStats,
  simDuration: number,
  elapsedMs: number,
  workerCount: number,
  remote?: string,
): Effect.Effect<void> => {
  const avgCasts = stats.totalCasts / stats.completedSims;
  const throughput = (stats.completedSims / elapsedMs) * 1000;

  return printResultsBox({
    avgCasts: avgCasts.toFixed(1),
    duration: `${simDuration}s`,
    elapsed: `${(elapsedMs / 1000).toFixed(2)}s`,
    engine: remote
      ? { clamp: true, label: "Server", value: remote }
      : { label: "Workers", value: String(workerCount) },
    iterations: fmt(stats.completedSims),
    throughput: `${fmt(Math.round(throughput))} sims/s`,
    totalCasts: fmt(stats.totalCasts),
  });
};
