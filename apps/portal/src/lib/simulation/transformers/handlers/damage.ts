import { defineHandler } from "../registry";

export const damageHandler = defineHandler(
  ["SPELL_DAMAGE", "SPELL_PERIODIC_DAMAGE"] as const,
  (event, ctx) => {
    ctx.emit.damage({
      type: "damage",
      id: ctx.ids.next("dmg"),
      spellId: event.spellId,
      timestamp: event.timestamp,
      amount: event.amount,
      isCrit: event.critical,
      target: event.destName || "Target",
      overkill: event.overkill > 0 ? event.overkill : undefined,
    });
  },
);

export const damageHandlers = [damageHandler];
