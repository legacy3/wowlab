"use client";

import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";
import { Effect, ManagedRuntime } from "effect";
import {
  SimcParserTag,
  SimcParserLive,
  type SimcProfile,
} from "@wowlab/parsers";
import { simcProfileToPortalData } from "@/lib/simc-adapter";

export const MAX_RECENT_CHARACTERS = 8;
export const recentCharacterSimcAtom = atomWithStorage<string[]>(
  "simulate-recent-characters",
  [],
);

const simcRuntime = ManagedRuntime.make(SimcParserLive);

export interface RecentCharacterSummary {
  simc: string;
  profile: SimcProfile;
  data: ReturnType<typeof simcProfileToPortalData>;
}

export const recentCharactersParsedAtom = atom(async (get) => {
  const simcList = get(recentCharacterSimcAtom);

  if (simcList.length === 0) {
    return [];
  }

  const parseOne = (simc: string) =>
    Effect.gen(function* () {
      const parser = yield* SimcParserTag;
      const profile = yield* parser.parse(simc);

      return { simc, profile, data: simcProfileToPortalData(profile) };
    });

  const program = Effect.forEach(
    simcList,
    (simc) => Effect.either(parseOne(simc)),
    { concurrency: "unbounded" },
  );

  const results = await simcRuntime.runPromise(program);

  return results.flatMap((r) => (r._tag === "Right" ? [r.right] : []));
});
