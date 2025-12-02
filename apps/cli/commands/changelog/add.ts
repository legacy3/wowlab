import { Command, Options, Prompt } from "@effect/cli";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

import {
  bumpVersion,
  Change,
  CHANGELOG_PATH,
  ChangelogEntry,
  ChangeType,
  readChangelog,
  writeChangelog,
} from "./shared.js";
import { syncToSupabase } from "./sync.js";

const descriptionOpt = Options.text("description").pipe(
  Options.withAlias("d"),
  Options.optional,
);
const noSyncOpt = Options.boolean("no-sync").pipe(Options.withDefault(false));
const syncOpt = Options.boolean("sync").pipe(
  Options.withAlias("s"),
  Options.withDefault(false),
);
const titleOpt = Options.text("title").pipe(Options.optional);
const typeOpt = Options.choice("type", [
  "breaking",
  "feature",
  "fix",
  "improvement",
]).pipe(Options.withAlias("t"), Options.optional);
const versionOpt = Options.text("version").pipe(
  Options.withAlias("v"),
  Options.optional,
);

interface AddOptions {
  description: Option.Option<string>;
  noSync: boolean;
  sync: boolean;
  title: Option.Option<string>;
  type: Option.Option<string>;
  version: Option.Option<string>;
}

const promptVersion = (entries: ChangelogEntry[], latestVersion: string) =>
  Effect.gen(function* () {
    const patchBump = bumpVersion(latestVersion, "patch");
    const minorBump = bumpVersion(latestVersion, "minor");
    const majorBump = bumpVersion(latestVersion, "major");

    const choices: Array<{ title: string; value: string }> = [
      { title: `${patchBump} (patch)`, value: patchBump },
      { title: `${minorBump} (minor)`, value: minorBump },
      { title: `${majorBump} (major)`, value: majorBump },
    ];

    if (entries.length > 0) {
      choices.push({ title: `── Existing ──`, value: "_separator" });

      for (const entry of entries.slice(0, 5)) {
        choices.push({
          title: `${entry.version} (${entry.date})`,
          value: entry.version,
        });
      }
    }

    const selected = yield* Prompt.select({
      choices,
      message: "Select version:",
    });

    return selected === "_separator" ? patchBump : selected;
  });

const promptType = () =>
  Prompt.select({
    choices: [
      { title: "feature - New functionality", value: "feature" as const },
      { title: "fix - Bug fix", value: "fix" as const },
      { title: "improvement - Enhancement", value: "improvement" as const },
      { title: "breaking - Breaking change", value: "breaking" as const },
    ],
    message: "Change type:",
  });

const promptTitle = () => Prompt.text({ message: "Title:" });

const promptDescription = () =>
  Effect.gen(function* () {
    const desc = yield* Prompt.text({
      default: "",
      message: "Description (optional):",
    });

    return desc.trim() || undefined;
  });

const addProgram = (opts: AddOptions) =>
  Effect.gen(function* () {
    const entries = yield* readChangelog;
    const today = new Date().toISOString().split("T")[0];
    const latestVersion = entries[0]?.version ?? "v0.0.0";

    const targetVersion = Option.isSome(opts.version)
      ? opts.version.value
      : yield* promptVersion(entries, latestVersion);

    const changeType: ChangeType = Option.isSome(opts.type)
      ? (opts.type.value as ChangeType)
      : yield* promptType();

    const title = Option.isSome(opts.title)
      ? opts.title.value
      : yield* promptTitle();

    const description = Option.isSome(opts.description)
      ? opts.description.value
      : yield* promptDescription();

    const change: Change = { title, type: changeType };
    if (description) {
      change.description = description;
    }

    const existingIndex = entries.findIndex((e) => e.version === targetVersion);
    if (existingIndex >= 0) {
      entries[existingIndex].changes.push(change);
      yield* Effect.logInfo(`Added ${changeType} to ${targetVersion}`);
    } else {
      entries.unshift({
        changes: [change],
        date: today,
        version: targetVersion,
      });

      yield* Effect.logInfo(`Created ${targetVersion} with ${changeType}`);
    }

    yield* writeChangelog(entries);
    yield* Effect.logInfo(`Changelog updated: ${CHANGELOG_PATH}`);

    if (opts.sync) {
      yield* syncToSupabase;
    } else if (!opts.noSync) {
      const shouldSync = yield* Prompt.confirm({
        initial: false,
        message: "Sync to Supabase now?",
      });

      if (shouldSync) {
        yield* syncToSupabase;
      }
    }
  });

export const addCommand = Command.make(
  "add",
  {
    description: descriptionOpt,
    noSync: noSyncOpt,
    sync: syncOpt,
    title: titleOpt,
    type: typeOpt,
    version: versionOpt,
  },
  addProgram,
);
