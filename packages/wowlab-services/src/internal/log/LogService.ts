import * as Effect from "effect/Effect";

export class LogService extends Effect.Service<LogService>()("LogService", {
  scoped: Effect.succeed({
    withName: (name: string) =>
      Effect.gen(function* () {
        yield* Effect.annotateLogsScoped({ logger: name });

        return {
          debug: (...args: unknown[]) => Effect.logDebug(...args),
          error: (...args: unknown[]) => Effect.logError(...args),
          info: (...args: unknown[]) => Effect.logInfo(...args),
          warn: (...args: unknown[]) => Effect.logWarning(...args),
        };
      }).pipe(Effect.scoped),
  }),
}) {}

export const ConsoleLogger = LogService.Default;
