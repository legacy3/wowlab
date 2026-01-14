import { atom } from "jotai";
import { Effect, ManagedRuntime } from "effect";
import {
  SimcParserTag,
  SimcParserLive,
  type SimcProfile,
  type SimcLexError,
  type SimcParseError,
  type SimcTransformError,
} from "@wowlab/parsers";
import {
  simcProfileToPortalData,
  type ParsedSimcData,
} from "@/lib/simc-adapter";
import {
  MAX_RECENT_CHARACTERS,
  recentCharacterSimcAtom,
} from "./recent-characters";

export type ParseError = SimcLexError | SimcParseError | SimcTransformError;

export type CharacterParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; data: ParsedSimcData; profile: SimcProfile }
  | { status: "error"; error: string };

const simcRuntime = ManagedRuntime.make(SimcParserLive);

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

export const simcInputAtom = atom<string>("");

export const characterParseStateAtom = atom<CharacterParseState>({
  status: "idle",
});

export const isParsingAtom = atom((get) => {
  const state = get(characterParseStateAtom);

  return state.status === "parsing";
});

export const parsedCharacterAtom = atom((get) => {
  const state = get(characterParseStateAtom);

  return state.status === "success" ? state.data : null;
});

export const simcProfileAtom = atom((get) => {
  const state = get(characterParseStateAtom);

  return state.status === "success" ? state.profile : null;
});

export const parseErrorAtom = atom((get) => {
  const state = get(characterParseStateAtom);

  return state.status === "error" ? state.error : null;
});

export const setSimcInputAtom = atom(null, async (get, set, input: string) => {
  set(simcInputAtom, input);

  if (input.trim().length < 50) {
    set(characterParseStateAtom, { status: "idle" });
    return;
  }

  set(characterParseStateAtom, { status: "parsing" });

  const program = Effect.gen(function* () {
    const parser = yield* SimcParserTag;

    return yield* parser.parse(input);
  });

  const result = await simcRuntime.runPromise(Effect.either(program));

  if (result._tag === "Left") {
    set(characterParseStateAtom, {
      status: "error",
      error: formatParseError(result.left),
    });
  } else {
    const portalData = simcProfileToPortalData(result.right);

    set(characterParseStateAtom, {
      status: "success",
      data: portalData,
      profile: result.right,
    });

    const current = get(recentCharacterSimcAtom);
    const trimmed = input.trim();
    const withoutDupes = current.filter((simc) => simc.trim() !== trimmed);

    set(
      recentCharacterSimcAtom,
      [trimmed, ...withoutDupes].slice(0, MAX_RECENT_CHARACTERS),
    );
  }
});

export const clearCharacterAtom = atom(null, (_get, set) => {
  set(simcInputAtom, "");
  set(characterParseStateAtom, { status: "idle" });
});
