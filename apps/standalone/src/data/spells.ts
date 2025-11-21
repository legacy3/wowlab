import * as Schemas from "@wowlab/core/Schemas";

export const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    baseDamage: 800,
    canCrit: true,
    castTime: 0,
    chargeCooldown: 0,
    charges: 0,
    coefficient: 0.429,
    cooldown: 12000,
    gcd: 1200,
    id: 108853,
    isInstant: true,
    name: "Fire Blast",
    resourceCost: {
      amount: 500,
      type: Schemas.Enums.Resource.Mana,
    },
    school: Schemas.Enums.SpellSchool.Fire,
    schoolMask: 0,
    travelTime: 0,
  },
  {
    baseDamage: 500,
    canCrit: true,
    castTime: 1500,
    chargeCooldown: 0,
    charges: 0,
    coefficient: 0.428,
    cooldown: 0,
    gcd: 1500,
    id: 2948,
    isInstant: false,
    name: "Scorch",
    resourceCost: {
      amount: 300,
      type: Schemas.Enums.Resource.Mana,
    },
    school: Schemas.Enums.SpellSchool.Fire,
    schoolMask: 0,
    travelTime: 0,
  },
];
