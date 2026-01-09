export function formatHandleInitials(handle?: string): string {
  if (!handle) {
    return "?";
  }

  return handle.slice(0, 2).toUpperCase();
}
