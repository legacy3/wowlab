// Base schema
export { CombatLogEventBase } from "./Base.js";

// Union and type guards
export {
  CombatLogEvent,
  hasSourceAndDest,
  isAuraEvent,
  isCastEvent,
  isDamageEvent,
  isEnergizeEvent,
  isHealEvent,
  isSpellEvent,
  type AuraEvent,
  type DamageEvent,
  type DrainEvent,
  type EnergizeEvent,
  type HealEvent,
  type SpellEvent,
  type Subevent,
} from "./CombatLogEvent.js";

// Events
export {
  EncounterEnd,
  EncounterStart,
  EnvironmentalDamage,
  PartyKill,
  RangeDamage,
  RangeMissed,
  SpellAuraApplied,
  SpellAuraAppliedDose,
  SpellAuraBroken,
  SpellAuraBrokenSpell,
  SpellAuraRefresh,
  SpellAuraRemoved,
  SpellAuraRemovedDose,
  SpellCastFailed,
  SpellCastStart,
  SpellCastSuccess,
  SpellCreate,
  SpellDamage,
  SpellDispel,
  SpellDrain,
  SpellEnergize,
  SpellExtraAttacks,
  SpellHeal,
  SpellInstakill,
  SpellInterrupt,
  SpellMissed,
  SpellPeriodicDamage,
  SpellPeriodicDrain,
  SpellPeriodicEnergize,
  SpellPeriodicHeal,
  SpellStolen,
  SpellSummon,
  SwingDamage,
  SwingMissed,
  UnitDestroyed,
  UnitDied,
} from "./Events.js";

// Lab events (simulation-generated)
export {
  isLabEvent,
  isLabRecoveryReady,
  LabEvent,
  LabRecoveryReady,
} from "./LabEvents.js";

// Prefixes
export { EnvironmentalPrefix, SpellPrefix } from "./Prefix.js";

// Suffixes
export {
  AuraSuffix,
  DamageSuffix,
  DispelSuffix,
  DrainSuffix,
  EnergizeSuffix,
  HealSuffix,
  InterruptSuffix,
  MissedSuffix,
} from "./Suffix.js";
