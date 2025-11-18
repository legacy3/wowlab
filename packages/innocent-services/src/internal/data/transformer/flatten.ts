import * as Spell from "@packages/innocent-schemas/Spell";

// TODO Figure out why this SpellDataFlatSchema import fails

export const flattenSpellData = (
  spell: Spell.SpellDataFlatSchema,
): Spell.SpellDataFlat => ({
  // Core
  iconName: spell.iconName,
  id: spell.id,
  name: spell.name,

  // Timing
  castTime: spell.castTime,
  cooldown: spell.cooldown,
  gcd: 1500, // TODO: Extract from actual cooldown data

  // Resources
  manaCost: spell.manaCost,

  // Charges (flatten from charges.maxCharges, charges.rechargeTime)
  maxCharges: spell.charges?.maxCharges ?? 0,
  rechargeTime: spell.charges?.rechargeTime ?? 0,

  // Range (flatten from range.ally.*, range.enemy.*)
  rangeAllyMax: spell.range?.ally.max ?? 0,
  rangeAllyMin: spell.range?.ally.min ?? 0,
  rangeEnemyMax: spell.range?.enemy.max ?? 0,
  rangeEnemyMin: spell.range?.enemy.min ?? 0,

  // Geometry (flatten from cone.degrees)
  coneDegrees: spell.cone?.degrees ?? 0,
  radius: spell.radius ?? [],

  // Damage/Defense (flatten from damage.schoolMask, defense.defenseType)
  defenseType: spell.defense?.defenseType ?? 0,
  schoolMask: spell.damage?.schoolMask ?? 0,

  // Scaling (flatten from scaling.spellPower, scaling.attackPower)
  scalingAttackPower: spell.scaling?.attackPower ?? 0,
  scalingSpellPower: spell.scaling?.spellPower ?? 0,

  // Interrupts (flatten from interrupts.*)
  interruptAura0: spell.interrupts?.aura[0] ?? 0,
  interruptAura1: spell.interrupts?.aura[1] ?? 0,
  interruptChannel0: spell.interrupts?.channel[0] ?? 0,
  interruptChannel1: spell.interrupts?.channel[1] ?? 0,
  interruptFlags: spell.interrupts?.flags ?? 0,

  // Duration (flatten from duration.duration, duration.max)
  duration: spell.duration?.duration ?? 0,
  durationMax: spell.duration?.max ?? 0,

  // Empower (flatten from empower.*)
  canEmpower: spell.empower?.canEmpower ?? false,
  empowerStages: spell.empower?.stages ?? [],

  // Mechanics (flatten from missile.speed, facing.facingFlags, dispel.dispelType)
  dispelType: spell.dispel?.dispelType ?? 0,
  facingFlags: spell.facing?.facingFlags ?? 0,
  missileSpeed: spell.missile?.speed ?? 0,

  // Arrays (already flat)
  attributes: spell.attributes ?? [],
  targeting: spell.targeting ?? [],
  triggers: spell.triggers ?? [],
});
