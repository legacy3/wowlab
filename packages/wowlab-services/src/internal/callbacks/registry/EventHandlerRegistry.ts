import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

/**
 * Registration input for a handler.
 */
export interface HandlerRegistration<
  T extends Events.EventType = Events.EventType,
> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly eventType: T;
  readonly name: string;
  readonly phase: Events.HandlerPhase;
  readonly phasePriority?: number;
}

/**
 * Internal metadata stored for each handler.
 */
interface HandlerMetadata<T extends Events.EventType = Events.EventType> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly name: string;
  readonly phase: Events.HandlerPhase;
  readonly phasePriority: number;
  readonly registrationOrder: number;
}

/**
 * Central registry for event handlers.
 * Handlers are registered at bootstrap and auto-injected into events.
 *
 * Phase execution order: CLEANUP → CORE → SECONDARY → POST
 *
 * Within each phase, handlers are sorted by:
 * 1. phasePriority (lower = earlier, default 0)
 * 2. registrationOrder (earlier registration = earlier execution)
 */
export class EventHandlerRegistry extends Effect.Service<EventHandlerRegistry>()(
  "EventHandlerRegistry",
  {
    effect: Effect.sync(() => {
      const handlers = new Map<Events.EventType, Array<HandlerMetadata<any>>>();
      let nextRegistrationOrder = 0;

      const sortHandlers = (list: Array<HandlerMetadata<any>>) => {
        list.sort(compareHandlers);
      };

      return {
        clear: (eventType: Events.EventType) => {
          handlers.delete(eventType);
        },

        clearAll: () => {
          handlers.clear();
          nextRegistrationOrder = 0;
        },

        getHandlerInfo: <T extends Events.EventType>(
          eventType: T,
        ): ReadonlyArray<{
          name: string;
          phase: Events.HandlerPhase;
          phasePriority: number;
        }> => {
          const list = handlers.get(eventType) ?? [];

          return list.map((h) => ({
            name: h.name,
            phase: h.phase,
            phasePriority: h.phasePriority,
          }));
        },

        getHandlers: <T extends Events.EventType>(
          eventType: T,
        ): ReadonlyArray<Events.ExecutionCallback<T>> => {
          const list = handlers.get(eventType) ?? [];
          return list.map((h) => h.callback);
        },

        register: <T extends Events.EventType>(
          registration: HandlerRegistration<T>,
        ) => {
          const list = handlers.get(registration.eventType) ?? [];

          list.push({
            callback: registration.callback,
            name: registration.name,
            phase: registration.phase,
            phasePriority: registration.phasePriority ?? 0,
            registrationOrder: nextRegistrationOrder++,
          });

          sortHandlers(list);
          handlers.set(registration.eventType, list);
        },

        registerMany: (
          registrations: ReadonlyArray<HandlerRegistration>,
        ): Effect.Effect<void> =>
          Effect.sync(() => {
            for (const reg of registrations) {
              const list = handlers.get(reg.eventType) ?? [];

              list.push({
                callback: reg.callback,
                name: reg.name,
                phase: reg.phase,
                phasePriority: reg.phasePriority ?? 0,
                registrationOrder: nextRegistrationOrder++,
              });

              sortHandlers(list);
              handlers.set(reg.eventType, list);
            }
          }),
      };
    }),
  },
) {}

/**
 * Compare handlers for sorting by phase → phasePriority → registrationOrder.
 */
function compareHandlers(a: HandlerMetadata, b: HandlerMetadata): number {
  // 1. Phase order (CLEANUP < CORE < SECONDARY < POST)
  const phaseCompare =
    Events.PHASE_ORDER.indexOf(a.phase) - Events.PHASE_ORDER.indexOf(b.phase);

  if (phaseCompare !== 0) {
    return phaseCompare;
  }

  // 2. Phase priority (lower = earlier)
  const priorityCompare = a.phasePriority - b.phasePriority;
  if (priorityCompare !== 0) {
    return priorityCompare;
  }

  // 3. Registration order
  return a.registrationOrder - b.registrationOrder;
}
