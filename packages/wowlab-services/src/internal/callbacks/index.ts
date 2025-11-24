/**
 * Event callback handlers organized by domain.
 *
 * Handlers are stateless Effect callbacks that respond to events.
 * Auto-injection via EventHandlerRegistry after bootstrap.
 */

export { EventHandlerBootstrapLayer } from "./bootstrap.js";
export * as cast from "./cast/index.js";
export * as cooldown from "./cooldown/index.js";
export * as damage from "./damage/index.js";
export {
  defineHandler,
  EventHandlerRegistry,
  type HandlerDefinition,
  type HandlerRegistration,
} from "./registry/EventHandlerRegistry.js";
