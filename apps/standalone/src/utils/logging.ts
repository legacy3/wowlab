import * as Entities from "@wowlab/core/Entities";
import * as Events from "@wowlab/core/Events";

export interface EventLogEntry {
  details: string;
  time: string;
  type: string;
}

export const formatEventTimeline = (
  events: Events.SimulationEvent[],
): EventLogEntry[] => {
  return events.map((event) => {
    let details = "";

    // TODO Make this less crappy
    if ("spell" in event.payload && event.payload.spell) {
      details = (event.payload.spell as Entities.Spell.Spell).info.name;
    }

    return {
      details,
      time: `${event.time}ms`,
      type: event.type,
    };
  });
};

export const logEventTimeline = (events: Events.SimulationEvent[]): void => {
  if (events.length === 0) {
    return;
  }

  console.log("\n=== Event Timeline ===\n");
  console.table(formatEventTimeline(events));
};
