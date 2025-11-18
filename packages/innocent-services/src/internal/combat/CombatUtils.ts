import * as Entities from "@packages/innocent-domain/Entities";

export const rollCrit = (caster: Entities.Unit): boolean => {
  const critChance = caster.paperDoll.critPercent;
  const roll = Math.random() * 100;
  return roll < critChance;
};

export const calculateBaseDamage = (
  spell: Entities.Spell,
  caster: Entities.Unit,
): number => {
  const spellPower = caster.paperDoll.mainStat;
  return spell.info.scalingSpellPower * spellPower;
};
