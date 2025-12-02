import * as FileSystem from "@effect/platform/FileSystem";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as YAML from "yaml";

export interface Change {
  description?: string;
  title: string;
  type: ChangeType;
}

export interface ChangelogEntry {
  changes: Change[];
  date: string;
  version: string;
}

export type ChangeType = "breaking" | "feature" | "fix" | "improvement";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CHANGELOG_PATH = path.resolve(
  __dirname,
  "../../../../CHANGELOG.yaml",
);

const KEY_ORDER = [
  "version",
  "date",
  "changes",
  "type",
  "title",
  "description",
];

export const readChangelog = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const exists = yield* fs.exists(CHANGELOG_PATH);

  if (!exists) {
    return [] as ChangelogEntry[];
  }

  const content = yield* fs.readFileString(CHANGELOG_PATH, "utf8");

  return (YAML.parse(content) ?? []) as ChangelogEntry[];
});

export const writeChangelog = (entries: ChangelogEntry[]) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const content = YAML.stringify(entries, {
      indent: 2,
      lineWidth: 0,
      sortMapEntries: (a, b) => {
        const aIdx = KEY_ORDER.indexOf(String(a.key));
        const bIdx = KEY_ORDER.indexOf(String(b.key));

        if (aIdx === -1 && bIdx === -1) {
          return 0;
        }

        if (aIdx === -1) {
          return 1;
        }

        if (bIdx === -1) {
          return -1;
        }

        return aIdx - bIdx;
      },
    });

    yield* fs.writeFileString(CHANGELOG_PATH, content);
  });

export const parseVersion = (
  version: string,
): [number, number, number] | null => {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
};

export const bumpVersion = (
  version: string,
  type: "major" | "minor" | "patch",
): string => {
  const parsed = parseVersion(version);
  if (!parsed) {
    return version;
  }

  const [major, minor, patch] = parsed;

  switch (type) {
    case "major":
      return `v${major + 1}.0.0`;

    case "minor":
      return `v${major}.${minor + 1}.0`;

    case "patch":
      return `v${major}.${minor}.${patch + 1}`;
  }
};
