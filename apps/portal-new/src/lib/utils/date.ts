import { format, parseISO } from "date-fns";

export function formatDate(
  dateStr: string,
  formatStr: string = "d MMM yyyy",
): string {
  try {
    return format(parseISO(dateStr), formatStr);
  } catch {
    return dateStr;
  }
}
