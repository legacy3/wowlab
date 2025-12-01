import { format } from "date-fns";
import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import { pipe } from "effect/Function";
import * as HashMap from "effect/HashMap";
import * as Logger from "effect/Logger";
import * as Option from "effect/Option";

import { printFormattedError } from "./error-formatter.js";

export interface EventLogEntry {
  details: string;
  time: string;
  type: string;
}

export const createServiceLogger = () =>
  Logger.make(({ annotations, cause, date, logLevel, message }) => {
    const loggerName = pipe(
      HashMap.get(annotations, "logger"),
      Option.map((v) => v as string),
      Option.getOrElse(() => ""),
    );

    const loggerPrefix = loggerName ? `(${loggerName})` : "";
    const level = logLevel.label.padEnd(5);
    const time = format(date, "HH:mm:ss.SSS");

    console.log(`[${time}][${level}]${loggerPrefix}: ${message}`);

    if (Cause.isFailure(cause)) {
      printFormattedError(Exit.failCause(cause));
    }
  });

// TODO: Implement with new combat log architecture
export const logEventTimeline = (_events: unknown[]): void => {
  console.log("Event timeline logging not implemented");
};
