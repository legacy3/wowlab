import * as Events from "@wowlab/core/Events";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface EventSchedulerService {
  readonly cancelEvent: (eventId: string) => Effect.Effect<void>;
  readonly isEmpty: Effect.Effect<boolean>;
  readonly nextEvent: Effect.Effect<Events.SimulationEvent | null>;
  readonly peekEvent: Effect.Effect<Events.SimulationEvent | null>;
  readonly schedule: (event: Events.SimulationEvent) => Effect.Effect<void>;
}

export const EventSchedulerService = Context.GenericTag<EventSchedulerService>(
  "@wowlab/services/EventSchedulerService",
);
