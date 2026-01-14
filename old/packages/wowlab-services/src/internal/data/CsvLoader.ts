import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import Papa from "papaparse";

export class ParseError extends Data.TaggedError("ParseError")<{
  cause: unknown;
}> {}

export const parseCsvData = <A, I>(
  csvContent: string,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A[], ParseError> =>
  Effect.gen(function* () {
    const rows: A[] = [];

    yield* Effect.try({
      catch: (error) => new ParseError({ cause: error }),
      try: () => {
        Papa.parse(csvContent, {
          dynamicTyping: false,
          header: true,
          skipEmptyLines: true,
          step: (result) => {
            if (result.errors.length > 0) {
              return;
            }

            const decoded = Schema.decodeUnknownEither(schema)(result.data);
            if (decoded._tag === "Right") {
              rows.push(decoded.right);
            }
          },
        });
      },
    });

    return rows;
  });
