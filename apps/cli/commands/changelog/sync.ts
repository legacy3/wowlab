import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import {
  createSupabaseClient,
  executeSupabaseQuery,
} from "../shared/supabase.js";
import { readChangelog } from "./shared.js";

export const syncToSupabase = Effect.gen(function* () {
  yield* Effect.logInfo("Syncing changelog to Supabase...");

  const entries = yield* readChangelog;
  if (entries.length === 0) {
    yield* Effect.logWarning("No entries found in CHANGELOG.yaml");
    return;
  }

  yield* Effect.logInfo(`Found ${entries.length} changelog entries`);
  const supabase = yield* createSupabaseClient();

  yield* Effect.logInfo("Clearing existing changelog entries...");
  yield* executeSupabaseQuery("delete all changelog", async () =>
    supabase.from("changelog").delete().neq("version", ""),
  );

  yield* Effect.logInfo("Inserting changelog entries...");
  yield* executeSupabaseQuery("insert changelog", async () =>
    supabase
      .from("changelog")
      .insert(
        entries.map((entry) => ({
          changes: entry.changes,
          createdAt: `${entry.date}T00:00:00Z`,
          version: entry.version,
        })),
      )
      .select(),
  );

  yield* Effect.logInfo(
    `Successfully synced ${entries.length} changelog entries`,
  );
});

export const syncCommand = Command.make("sync", {}, () => syncToSupabase);
