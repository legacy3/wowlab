import { formatDurationSeconds, formatCompact } from "@/lib/format";

export function formatDamage(amount: number): string {
  return formatCompact(amount);
}

export function formatTime(seconds: number): string {
  return formatDurationSeconds(seconds);
}
