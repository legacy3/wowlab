import { formatDate } from "@/lib/format";

export function DocUpdatedAt({ date }: { date?: string }) {
  if (!date) {
    return null;
  }

  const formatted = formatDate(date, "MMMM d, yyyy");
  if (!formatted) {
    return null;
  }

  return (
    <p className="mt-8 text-sm text-muted-foreground">
      Last updated: {formatted}
    </p>
  );
}
