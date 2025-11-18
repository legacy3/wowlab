import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";

export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
  source: string;
  timestamp: number;
}

export class LogService extends Effect.Service<LogService>()("LogService", {
  effect: Effect.gen(function* () {
    const logPubSub = yield* PubSub.unbounded<LogEntry>();

    const emit = (entry: LogEntry) =>
      Effect.asVoid(PubSub.publish(logPubSub, entry));

    return {
      debug: (
        source: string,
        message: string,
        metadata?: Record<string, unknown>,
      ) =>
        emit({
          level: "debug",
          message,
          metadata,
          source,
          timestamp: Date.now(),
        }),

      error: (
        source: string,
        message: string,
        metadata?: Record<string, unknown>,
      ) =>
        emit({
          level: "error",
          message,
          metadata,
          source,
          timestamp: Date.now(),
        }),

      info: (
        source: string,
        message: string,
        metadata?: Record<string, unknown>,
      ) =>
        emit({
          level: "info",
          message,
          metadata,
          source,
          timestamp: Date.now(),
        }),

      logs: logPubSub,

      warn: (
        source: string,
        message: string,
        metadata?: Record<string, unknown>,
      ) =>
        emit({
          level: "warn",
          message,
          metadata,
          source,
          timestamp: Date.now(),
        }),
    };
  }),
}) {}
