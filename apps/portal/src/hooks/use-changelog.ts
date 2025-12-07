import { useList } from "@refinedev/core";
import { format } from "date-fns";
import type { Tables } from "@/lib/supabase/database.types";

type ChangelogRow = Tables<"changelog">;

type ChangeType = "feature" | "improvement" | "fix" | "breaking";

export type ChangelogChange = {
  type: ChangeType;
  title: string;
  description?: string;
};

export type ChangelogEntry = {
  id: string;
  version: string;
  date: string;
  changes: ChangelogChange[];
};

function transformEntry(row: ChangelogRow): ChangelogEntry {
  return {
    id: row.id,
    version: row.version,
    date: format(new Date(row.createdAt), "yyyy-MM-dd"),
    changes: row.changes as ChangelogChange[],
  };
}

export function useChangelog() {
  const {
    result,
    query: { isLoading, isError },
  } = useList<ChangelogRow>({
    resource: "changelog",
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const entries = result?.data.map(transformEntry) ?? [];

  return {
    entries,
    isLoading,
    isError,
  };
}
