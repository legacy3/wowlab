import { CombatLog } from "@wowlab/core/Schemas";

const SPELL_CAST_EVENTS: readonly CombatLog.Subevent[] = [
  "SPELL_CAST_START",
  "SPELL_CAST_SUCCESS",
];

const AURA_EVENTS: readonly CombatLog.Subevent[] = [
  "SPELL_AURA_APPLIED",
  "SPELL_AURA_REFRESH",
  "SPELL_AURA_REMOVED",
  "SPELL_AURA_APPLIED_DOSE",
  "SPELL_AURA_REMOVED_DOSE",
];

const DAMAGE_EVENTS: readonly CombatLog.Subevent[] = [
  "SPELL_DAMAGE",
  "SPELL_PERIODIC_DAMAGE",
];

const HEAL_EVENTS: readonly CombatLog.Subevent[] = [
  "SPELL_HEAL",
  "SPELL_PERIODIC_HEAL",
];

export const EVENT_STREAM_FILTER: readonly CombatLog.Subevent[] = [
  ...SPELL_CAST_EVENTS,
  ...AURA_EVENTS,
  ...DAMAGE_EVENTS,
  ...HEAL_EVENTS,
];

const describeUnit = (name?: string | null, fallback?: string): string =>
  name && name.length > 0 ? name : (fallback ?? "Unknown");

const describeSpell = (event: CombatLog.CombatLogEvent): string =>
  "spellName" in event && event.spellName ? event.spellName : "Melee swing";

const describeSpellWithId = (event: CombatLog.CombatLogEvent): string =>
  `${describeSpell(event)}${"spellId" in event ? ` (${event.spellId})` : ""}`;

const stackAmount = (event: CombatLog.CombatLogEvent): number =>
  "amount" in event && typeof event.amount === "number" ? event.amount : 0;

export const formatTimelineEvent = (
  event: CombatLog.CombatLogEvent,
): string => {
  const timestamp = `[${event.timestamp.toFixed(3)}s]`;
  
  const source =
    "sourceName" in event
      ? describeUnit(
          event.sourceName,
          "sourceGUID" in event ? event.sourceGUID : undefined,
        )
      : "Unknown";

  const dest =
    "destName" in event
      ? describeUnit(
          event.destName,
          "destGUID" in event ? event.destGUID : undefined,
        )
      : "Unknown";

  // prettier-ignore
  switch (event._tag) {
    case "SPELL_AURA_APPLIED":
      return `${timestamp} ${describeSpell(event)} applied to ${dest}`;

    case "SPELL_AURA_APPLIED_DOSE":
      return `${timestamp} ${describeSpell(event)} stacks ${stackAmount(event)} on ${dest}`;

    case "SPELL_AURA_REFRESH":
      return `${timestamp} ${describeSpell(event)} refreshed on ${dest}`;

    case "SPELL_AURA_REMOVED":
      return `${timestamp} ${describeSpell(event)} faded from ${dest}`;

    case "SPELL_AURA_REMOVED_DOSE":
      return `${timestamp} ${describeSpell(event)} stacks removed (${stackAmount(event)}) from ${dest}`;

    case "SPELL_CAST_START":
      return `${timestamp} ${source} begins casting ${describeSpell(event)}`;

    case "SPELL_CAST_SUCCESS":
      return `${timestamp} ${source} casts ${describeSpellWithId(event)}`;

    case "SPELL_DAMAGE":
    case "SPELL_PERIODIC_DAMAGE":
      return `${timestamp} ${describeSpell(event)} hits ${dest} for ${"amount" in event ? event.amount : 0}`;

    case "SPELL_HEAL":
    case "SPELL_PERIODIC_HEAL":
      return `${timestamp} ${describeSpell(event)} heals ${dest} for ${"amount" in event ? event.amount : 0}`;

    default:
      return `${timestamp} ${event._tag}`;
  }
};
