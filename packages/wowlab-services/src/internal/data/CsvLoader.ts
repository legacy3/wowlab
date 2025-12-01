import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import Papa from "papaparse";

import { LogService } from "../log/LogService.js";

export class ParseError extends Data.TaggedError("ParseError")<{
  cause: unknown;
}> {}

export const parseCsvData = <A, I>(
  csvContent: string,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A[], ParseError, LogService> =>
  Effect.gen(function* () {
    const logService = yield* LogService;
    const logger = yield* logService.withName("CsvLoader");

    yield* logger.info(`Parsing CSV with length: ${csvContent.length}`);

    const rows: A[] = [];
    let firstValidationError: unknown = null;
    let firstRowData: unknown = null;
    let validationErrorCount = 0;
    const parseErrors: Papa.ParseError[] = [];

    yield* Effect.try({
      catch: (error) => new ParseError({ cause: error }),
      try: () => {
        Papa.parse(csvContent, {
          dynamicTyping: false,
          header: true,
          skipEmptyLines: true,
          step: (result) => {
            if (result.errors.length > 0) {
              parseErrors.push(...result.errors);
              return;
            }

            const decoded = Schema.decodeUnknownEither(schema)(result.data);
            if (decoded._tag === "Right") {
              rows.push(decoded.right);
            } else {
              validationErrorCount++;
              if (firstValidationError === null) {
                firstValidationError = decoded.left;
                firstRowData = result.data;
              }
            }
          },
        });
      },
    });

    if (parseErrors.length > 0) {
      yield* logger.error(
        `Encountered ${parseErrors.length} CSV parsing errors.`,
      );

      yield* logger.debug(`First CSV error: ${JSON.stringify(parseErrors[0])}`);
    }

    if (validationErrorCount > 0) {
      yield* logger.warn(
        `Encountered ${validationErrorCount} schema validation errors.`,
      );

      if (firstValidationError) {
        yield* logger.debug(
          `First validation error details: ${JSON.stringify(firstValidationError, null, 2)}`,
        );

        yield* logger.debug(
          `Row data causing error: ${JSON.stringify(firstRowData, null, 2)}`,
        );
      }
    }

    return rows;
  });
