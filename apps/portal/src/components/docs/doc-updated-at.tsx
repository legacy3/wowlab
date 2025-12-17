import { format, parseISO, isValid } from "date-fns";

export function DocUpdatedAt({ date }: { date?: string }) {
  if (!date) {
    return null;
  }

  const parsed = parseISO(date);
  if (!isValid(parsed)) {
    return null;
  }

  const formatted = format(parsed, "MMMM d, yyyy");

  return (
    <p className="mt-8 text-sm text-muted-foreground">
      Last updated: {formatted}
    </p>
  );
}
