import {
  format,
  formatDistanceToNow,
  formatISO,
  isValid,
  parseISO,
} from "date-fns";
import humanizeDuration from "humanize-duration";

export type DateInput = Date | string;

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const durationOptions: humanizeDuration.Options = {
  largest: 2,
  round: true,
  units: ["d", "h", "m", "s"],
};

function toDate(input: DateInput): Date {
  return typeof input === "string" ? parseISO(input) : input;
}

export function formatDate(input: DateInput, pattern: string): string {
  const date = toDate(input);
  if (!isValid(date)) {
    return "";
  }

  return format(date, pattern);
}

export function formatRelativeToNow(
  input: DateInput,
  options?: { addSuffix?: boolean },
): string {
  const date = toDate(input);
  if (!isValid(date)) {
    return "";
  }

  return formatDistanceToNow(date, {
    addSuffix: options?.addSuffix ?? true,
  });
}

export function formatIsoTimestamp(input: DateInput = new Date()): string {
  const date = toDate(input);
  if (!isValid(date)) {
    return "";
  }

  return formatISO(date);
}

// Spell-description number formatting (stable precision, trim zeros)
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) {
    return "0";
  }

  const rounded = Math.abs(n) < 1e-9 ? 0 : n;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded.toFixed(3).replace(/\.?0+$/, "");
}

export function formatInt(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDurationMs(ms: number | null): string {
  if (ms === null) {
    return "-";
  }

  if (ms < 1000) {
    return humanizeDuration(ms, { units: ["ms"], round: true });
  }

  return humanizeDuration(ms, durationOptions);
}

export function formatDurationSeconds(seconds: number): string {
  return humanizeDuration(seconds * 1000, durationOptions);
}
