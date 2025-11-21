import * as Effect from "effect/Effect";

export class LogService extends Effect.Service<LogService>()("LogService", {
  effect: Effect.succeed({
    debug: (message: string, context?: Record<string, unknown>) =>
      Effect.sync(() => console.debug(message, context)),
    error: (message: string, context?: Record<string, unknown>) =>
      Effect.sync(() => console.error(message, context)),
    info: (message: string, context?: Record<string, unknown>) =>
      Effect.sync(() => console.info(message, context)),
    warn: (message: string, context?: Record<string, unknown>) =>
      Effect.sync(() => console.warn(message, context)),
  }),
}) {}

export const ConsoleLogger = LogService.Default;
