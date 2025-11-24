import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

export interface HandlerDefinition<
  T extends Events.EventType = Events.EventType,
> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly name: string;
  readonly phase: Events.HandlerPhase;
  readonly phasePriority?: number;
}

interface HandlerMetadata<T extends Events.EventType = Events.EventType> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly name: string;
  readonly phase: Events.HandlerPhase;
  readonly phasePriority: number;
  readonly registrationOrder: number;
}

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
          eventType: T,
          handler: HandlerDefinition<T>,
        ) => {
          const list = handlers.get(eventType) ?? [];

          list.push({
            callback: handler.callback,
            name: handler.name,
            phase: handler.phase,
            phasePriority: handler.phasePriority ?? 0,
            registrationOrder: nextRegistrationOrder++,
          });

          sortHandlers(list);
          handlers.set(eventType, list);
        },

        registerMany: <T extends Events.EventType>(
          eventType: T,
          handlerDefs: ReadonlyArray<HandlerDefinition<T>>,
        ) => {
          const list = handlers.get(eventType) ?? [];

          for (const handler of handlerDefs) {
            list.push({
              callback: handler.callback,
              name: handler.name,
              phase: handler.phase,
              phasePriority: handler.phasePriority ?? 0,
              registrationOrder: nextRegistrationOrder++,
            });
          }

          sortHandlers(list);
          handlers.set(eventType, list);
        },
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
