import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface LogService {
  readonly debug: (
    message: string,
    context?: Record<string, unknown>,
  ) => Effect.Effect<void>;
  readonly error: (
    message: string,
    context?: Record<string, unknown>,
  ) => Effect.Effect<void>;
  readonly info: (
    message: string,
    context?: Record<string, unknown>,
  ) => Effect.Effect<void>;
  readonly warn: (
    message: string,
    context?: Record<string, unknown>,
  ) => Effect.Effect<void>;
}

export const LogService = Context.GenericTag<LogService>(
  "@wowlab/services/LogService",
);
