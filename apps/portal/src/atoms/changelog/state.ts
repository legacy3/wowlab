import { atom } from "jotai";
import { format } from "date-fns";
import { Schema, Effect } from "effect";
import { supabaseClientAtom } from "../supabase/client";

// Schema for individual changelog change entries
const ChangelogChangeSchema = Schema.Struct({
  type: Schema.Literal("feature", "improvement", "fix", "breaking"),
  title: Schema.String,
  description: Schema.optional(Schema.String),
});

// Schema for the changes array
const ChangesSchema = Schema.Array(ChangelogChangeSchema);

export const changelogEntriesAtom = atom(async (get) => {
  const supabase = get(supabaseClientAtom);

  const { data, error } = await supabase
    .from("changelog")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }

  const entries = await Promise.all(
    (data ?? []).map(async (entry) => {
      const changes = await Effect.runPromise(
        Schema.decodeUnknown(ChangesSchema)(entry.changes),
      );

      return {
        version: entry.version,
        date: format(new Date(entry.createdAt), "yyyy-MM-dd"),
        changes,
      };
    }),
  );

  return entries;
});
