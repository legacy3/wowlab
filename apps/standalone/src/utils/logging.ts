import * as Events from "@wowlab/core/Events";

export interface EventLogEntry {
  details: string;
  time: string;
  type: string;
}

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

export const formatEventTimeline = (
  events: Events.SimulationEvent[],
): EventLogEntry[] => {
  const sortedEvents = [...events].sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return a.id.localeCompare(b.id);
  });

  return sortedEvents.map((event) => ({
    details: extractEventDetails(event),
    time: `${event.time}ms`,
    type: event.type,
  }));
};

export const logEventTimeline = (events: Events.SimulationEvent[]): void => {
  if (events.length === 0) {
    return;
  }

  console.log("\n=== Event Timeline ===\n");
  console.table(formatEventTimeline(events));
};
