import { Context, Data, Effect, Layer } from "effect";

import type { SimcProfile } from "./internal/simc/types";

import { tokenize } from "./internal/simc/lexer";
import { parse } from "./internal/simc/parser";
import {
  parseSavedLoadoutsFromInput,
  simcVisitor,
  transformToProfile,
} from "./internal/simc/visitor";

export * from "./internal/simc";
export * from "./internal/simc/types";

export interface SimcParser {
  readonly parse: (
    input: string,
  ) => Effect.Effect<
    SimcProfile,
    SimcLexError | SimcParseError | SimcTransformError
  >;
}

export class SimcLexError extends Data.TaggedError("SimcLexError")<{
  readonly errors: ReadonlyArray<{
    readonly column: number;
    readonly length: number;
    readonly line: number;
    readonly message: string;
  }>;
}> {}

export class SimcParseError extends Data.TaggedError("SimcParseError")<{
  readonly errors: ReadonlyArray<{
    readonly message: string;
    readonly token?: {
      readonly endColumn: number;
      readonly endLine: number;
      readonly image: string;
      readonly startColumn: number;
      readonly startLine: number;
    };
  }>;
}> {}

export class SimcTransformError extends Data.TaggedError("SimcTransformError")<{
  readonly message: string;
}> {}

export const SimcParserTag = Context.GenericTag<SimcParser>(
  "@wowlab/parsers/SimcParser",
);

const make = Effect.succeed(
  SimcParserTag.of({
    parse: (input: string) =>
      Effect.gen(function* () {
        const lexResult = tokenize(input);
        if (lexResult.errors.length > 0) {
          return yield* Effect.fail(
            new SimcLexError({
              errors: lexResult.errors.map((e) => ({
                column: e.column ?? 0,
                length: e.length,
                line: e.line ?? 0,
                message: e.message,
              })),
            }),
          );
        }

        const parseResult = parse(input, lexResult);
        if (parseResult.errors.length > 0) {
          return yield* Effect.fail(
            new SimcParseError({
              errors: parseResult.errors.map((e) => ({
                message: e.message,
                token: e.token
                  ? {
                      endColumn: e.token.endColumn ?? 0,
                      endLine: e.token.endLine ?? 0,
                      image: e.token.image,
                      startColumn: e.token.startColumn ?? 0,
                      startLine: e.token.startLine ?? 0,
                    }
                  : undefined,
              })),
            }),
          );
        }

        try {
          const visitorResult = simcVisitor.visit(parseResult.cst);
          const savedLoadouts = parseSavedLoadoutsFromInput(input);
          const profile = transformToProfile(visitorResult, { savedLoadouts });

          return profile;
        } catch (error) {
          return yield* Effect.fail(
            new SimcTransformError({
              message: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      }),
  }),
);

export const SimcParserLive = Layer.effect(SimcParserTag, make);
