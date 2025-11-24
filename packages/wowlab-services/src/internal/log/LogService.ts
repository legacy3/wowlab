import * as Effect from "effect/Effect";

export class LogService extends Effect.Service<LogService>()("LogService", {
  scoped: Effect.succeed({
    withName: (name: string) =>
      Effect.gen(function* () {
        yield* Effect.annotateLogsScoped({ logger: name });

        return {
          debug: (...args: unknown[]) =>
            Effect.logDebug(...args).pipe(
              Effect.annotateLogs({ logger: name }),
            ),

          error: (...args: unknown[]) =>
            Effect.logError(...args).pipe(
              Effect.annotateLogs({ logger: name }),
            ),

          info: (...args: unknown[]) =>
            Effect.logInfo(...args).pipe(Effect.annotateLogs({ logger: name })),

          warn: (...args: unknown[]) =>
            Effect.logWarning(...args).pipe(
              Effect.annotateLogs({ logger: name }),
            ),
        };
      }).pipe(Effect.scoped),
  }),
}) {}

export const ConsoleLogger = LogService.Default;
