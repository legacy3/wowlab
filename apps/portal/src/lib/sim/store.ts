"use client";

import {
  SimcLexError,
  SimcParseError,
  SimcParserLive,
  SimcParserTag,
  type SimcProfile,
  SimcTransformError,
} from "@wowlab/parsers";
import { Effect, ManagedRuntime } from "effect";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  CharacterParseState,
  ParsedSimcData,
  RecentCharacterSummary,
} from "./types";

import { simcProfileToPortalData } from "./simc-adapter";

type ParseError = SimcLexError | SimcParseError | SimcTransformError;

function formatParseError(error: ParseError): string {
  switch (error._tag) {
    case "SimcLexError":
      return `Lexer error: ${error.errors.map((e) => e.message).join(", ")}`;

    case "SimcParseError":
      return `Parse error: ${error.errors.map((e) => e.message).join(", ")}`;

    case "SimcTransformError":
      return `Transform error: ${error.message}`;

    default:
      return "Unknown error";
  }
}

const simcRuntime = ManagedRuntime.make(SimcParserLive);

export const MAX_RECENT_CHARACTERS = 8;

// Character input store
interface CharacterInputStore {
  clearCharacter: () => void;
  input: string;
  parseState: CharacterParseState;
  setInput: (input: string) => Promise<void>;
}

export const useCharacterInput = create<CharacterInputStore>()((set, get) => ({
  clearCharacter: () => {
    set({ input: "", parseState: { status: "idle" } });
  },

  input: "",

  parseState: { status: "idle" },

  setInput: async (input: string) => {
    set({ input });

    if (input.trim().length < 50) {
      set({ parseState: { status: "idle" } });
      return;
    }

    set({ parseState: { status: "parsing" } });

    const program = Effect.gen(function* () {
      const parser = yield* SimcParserTag;
      return yield* parser.parse(input);
    });

    const result = await simcRuntime.runPromise(Effect.either(program));

    if (result._tag === "Left") {
      set({
        parseState: {
          error: formatParseError(result.left),
          status: "error",
        },
      });
    } else {
      const portalData = simcProfileToPortalData(result.right);

      set({
        parseState: {
          data: portalData,
          profile: result.right,
          status: "success",
        },
      });

      // Add to recent characters
      const { addRecent } = useRecentCharacters.getState();
      addRecent(input.trim(), result.right, portalData);
    }
  },
}));

// Recent characters store (persisted)
interface RecentCharactersStore {
  addRecent: (simc: string, profile: SimcProfile, data: ParsedSimcData) => void;
  clearRecent: () => void;
  recent: string[];
  removeRecent: (simc: string) => void;
}

export const useRecentCharacters = create<RecentCharactersStore>()(
  persist(
    (set, get) => ({
      addRecent: (simc, _profile, _data) => {
        const current = get().recent;
        const trimmed = simc.trim();
        const withoutDupes = current.filter((s) => s.trim() !== trimmed);
        set({
          recent: [trimmed, ...withoutDupes].slice(0, MAX_RECENT_CHARACTERS),
        });
      },

      clearRecent: () => set({ recent: [] }),

      recent: [],

      removeRecent: (simc) => {
        const current = get().recent;
        set({ recent: current.filter((s) => s.trim() !== simc.trim()) });
      },
    }),
    { name: "wowlab-recent-characters" },
  ),
);

// Selector for parsed character data
export const selectParsedCharacter = (
  state: CharacterInputStore,
): ParsedSimcData | null =>
  state.parseState.status === "success" ? state.parseState.data : null;

// Selector for simc profile
export const selectSimcProfile = (
  state: CharacterInputStore,
): SimcProfile | null =>
  state.parseState.status === "success" ? state.parseState.profile : null;

// Selector for parse error
export const selectParseError = (state: CharacterInputStore): string | null =>
  state.parseState.status === "error" ? state.parseState.error : null;

// Selector for is parsing
export const selectIsParsing = (state: CharacterInputStore): boolean =>
  state.parseState.status === "parsing";

// Hook to parse recent characters on demand
export async function parseRecentCharacters(): Promise<
  RecentCharacterSummary[]
> {
  const { recent } = useRecentCharacters.getState();

  if (recent.length === 0) {
    return [];
  }

  const parseOne = (simc: string) =>
    Effect.gen(function* () {
      const parser = yield* SimcParserTag;
      const profile = yield* parser.parse(simc);
      return { data: simcProfileToPortalData(profile), profile, simc };
    });

  const program = Effect.forEach(
    recent,
    (simc) => Effect.either(parseOne(simc)),
    { concurrency: "unbounded" },
  );

  const results = await simcRuntime.runPromise(program);

  return results.flatMap((r) => (r._tag === "Right" ? [r.right] : []));
}
