import { defineHandler } from "../registry";

export const auraAppliedHandler = defineHandler(
  ["SPELL_AURA_APPLIED"] as const,
  (event, ctx) => {
    ctx.state.auras.apply(
      event.destGUID,
      event.spellId,
      event.timestamp,
      event.destName || "Target",
      event.auraType === "DEBUFF" ? "debuff" : "buff",
    );
  },
);

export const auraRemovedHandler = defineHandler(
  ["SPELL_AURA_REMOVED"] as const,
  (event, ctx) => {
    ctx.state.auras.remove(
      event.destGUID,
      event.spellId,
      event.timestamp,
      ctx.ids,
      ctx.emit.buff,
    );
  },
);

export const auraRefreshHandler = defineHandler(
  ["SPELL_AURA_REFRESH"] as const,
  (event, ctx) => {
    ctx.state.auras.refresh(
      event.destGUID,
      event.spellId,
      event.timestamp,
      ctx.ids,
      ctx.emit.buff,
    );
  },
);

export const auraAppliedDoseHandler = defineHandler(
  ["SPELL_AURA_APPLIED_DOSE"] as const,
  (event, ctx) => {
    if (typeof event.amount === "number") {
      ctx.state.auras.updateStacks(event.destGUID, event.spellId, event.amount);
    }
  },
);

export const auraRemovedDoseHandler = defineHandler(
  ["SPELL_AURA_REMOVED_DOSE"] as const,
  (event, ctx) => {
    if (typeof event.amount === "number") {
      ctx.state.auras.updateStacks(event.destGUID, event.spellId, event.amount);
    }
  },
);

export const auraHandlers = [
  auraAppliedHandler,
  auraRemovedHandler,
  auraRefreshHandler,
  auraAppliedDoseHandler,
  auraRemovedDoseHandler,
];
