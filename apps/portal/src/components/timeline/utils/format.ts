export function formatDamage(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }

  return amount.toString();
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 0) {
    return `${mins}:${secs.toFixed(1).padStart(4, "0")}`;
  }

  return `${secs.toFixed(1)}s`;
}
