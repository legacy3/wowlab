export function getCoverageColor(percentage: number): string {
  if (percentage >= 90) {
    return "bg-emerald-500";
  }

  if (percentage >= 70) {
    return "bg-emerald-400";
  }

  if (percentage >= 50) {
    return "bg-amber-400";
  }

  if (percentage >= 30) {
    return "bg-amber-500";
  }

  if (percentage >= 10) {
    return "bg-rose-400";
  }

  return "bg-rose-500";
}

export function getCoverageTextColor(percentage: number): string {
  if (percentage >= 70) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (percentage >= 50) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-rose-600 dark:text-rose-400";
}
