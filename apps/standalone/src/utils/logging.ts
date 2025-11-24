import * as Events from "@wowlab/core/Events";
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

type EventSerializer<T extends Events.EventType> = (
  event: Events.SimulationEvent<T>,
) => string;

// prettier-ignore
const EVENT_SERIALIZERS: {
  [K in Events.EventType]: EventSerializer<K>;
} = {
  [Events.EventType.APL_EVALUATE]: () => "",
  [Events.EventType.AURA_EXPIRE]: (event) => event.payload.aura.info.name,
  [Events.EventType.AURA_STACK_DECAY]: (event) => event.payload.aura.info.name,
  [Events.EventType.PERIODIC_POWER]: () => "Focus Regen",
  [Events.EventType.PERIODIC_SPELL]: () => "",
  [Events.EventType.PROJECTILE_IMPACT]: (event) => `${event.payload.spell.info.name} → ${event.payload.targetUnitId}`,
  [Events.EventType.SPELL_CAST_COMPLETE]: (event) => event.payload.spell.info.name,
  [Events.EventType.SPELL_CAST_START]: (event) => event.payload.spell.info.name,
  [Events.EventType.SPELL_CHARGE_READY]: (event) => event.payload.spell.info.name,
  [Events.EventType.SPELL_COOLDOWN_READY]: (event) => event.payload.spell.info.name,
  [Events.EventType.SPELL_DAMAGE]: (event) => `${event.payload.spell.info.name} (${event.payload.damage})`,
};

const extractEventDetails = (event: Events.SimulationEvent): string => {
  return EVENT_SERIALIZERS[event.type](event as never);
};

const formatEvents = (events: Events.SimulationEvent[]): EventLogEntry[] => {
  return events.map((event) => ({
    details: extractEventDetails(event),
    time: `${event.at}ms`,
    type: event.type,
  }));
};

export const logEventTimeline = (events: Events.SimulationEvent[]): void => {
  if (events.length === 0) {
    return;
  }

  const timeline = [...events].sort((a, b) => {
    if (a.at !== b.at) {
      return a.at - b.at;
    }

    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return a.id.localeCompare(b.id);
  });

  console.log("\n=== Event Timeline (Execution Order) ===\n");
  console.table(formatEvents(timeline));

  console.log("\n=== Event Log (Receival Order) ===\n");
  console.table(formatEvents(events));
};
