import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Data from "effect/Data";
import Papa from "papaparse";
import * as fs from "node:fs";

export class FileReadError extends Data.TaggedError("FileReadError")<{
  filePath: string;
  cause: unknown;
}> {}

export class ParseError extends Data.TaggedError("ParseError")<{
  cause: unknown;
}> {}

export const loadCsvFile = <A, I>(
  filePath: string,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A[], FileReadError | ParseError> =>
  Effect.gen(function* () {
    const rows: A[] = [];

    yield* Effect.tryPromise({
      try: async () => {
        return new Promise((resolve, reject) => {
          const stream = fs.createReadStream(filePath);
          Papa.parse(stream, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            step: (result) => {
              const decoded = Schema.decodeUnknownEither(schema)(result.data);
              if (decoded._tag === "Right") {
                rows.push(decoded.right);
              } else {
                // console.warn("Validation error", decoded.left)
              }
            },
            complete: () => resolve(rows),
            error: (error) => reject(error),
          });
        });
      },
      catch: (error) => new FileReadError({ filePath, cause: error }),
    });

    return rows;
  });
