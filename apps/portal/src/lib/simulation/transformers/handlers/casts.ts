import { defineHandler } from "../registry";

export const castStartHandler = defineHandler(
  ["SPELL_CAST_START"] as const,
  (event, ctx) => {
    ctx.state.casts.start(
      event.sourceGUID,
      event.spellId,
      event.timestamp,
      event.destName,
    );
  },
);

export const castSuccessHandler = defineHandler(
  ["SPELL_CAST_SUCCESS"] as const,
  (event, ctx) => {
    const resolved = ctx.state.casts.resolve(
      event.sourceGUID,
      event.spellId,
      event.timestamp,
      event.destName,
      true,
    );

    ctx.emit.cast({
      type: "cast",
      id: ctx.ids.next("cast"),
      spellId: event.spellId,
      timestamp: resolved.timestamp,
      duration: resolved.duration,
      target: resolved.target,
      successful: true,
    });
  },
);

export const castFailedHandler = defineHandler(
  ["SPELL_CAST_FAILED"] as const,
  (event, ctx) => {
    const resolved = ctx.state.casts.resolve(
      event.sourceGUID,
      event.spellId,
      event.timestamp,
      event.destName,
      false,
    );

    ctx.emit.cast({
      type: "cast",
      id: ctx.ids.next("cast"),
      spellId: event.spellId,
      timestamp: resolved.timestamp,
      duration: resolved.duration,
      target: resolved.target,
      successful: false,
    });
  },
);

export const castHandlers = [
  castStartHandler,
  castSuccessHandler,
  castFailedHandler,
];
