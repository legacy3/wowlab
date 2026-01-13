import type { EquipmentSlot } from "@/lib/sim";

export const fixtures = {
  character: {
    class: "Shaman",
    level: 80,
    name: "Wellenwilli",
    race: "Tauren",
    realm: "Blackmoore",
    region: "EU",
    spec: "Restoration",
  },

  code: {
    reactHook: `import { useSpell } from "@/lib/state";

export function SpellInfo({ id }: { id: number }) {
  const { data: spell } = useSpell(id);

  if (!spell) {
    return null;
  }

  return <div>{spell.name}</div>;
}`,
  },

  error: {
    simple: "Error: Failed to connect to simulation server",
    stackTrace: `TypeError: Cannot read property 'dps' of undefined
at calculateDamage (engine.ts:142)
at runSimulation (simulation.ts:89)
at async main (index.ts:12)`,
  },

  frameworks: [
    { label: "React", value: "react" },
    { label: "Vue", value: "vue" },
    { label: "Svelte", value: "svelte" },
    { label: "Angular", value: "angular" },
    { label: "Solid", value: "solid" },
  ],

  gear: {
    back: 222817, // Consecrated Cloak
    chest: 212011, // Consecrated Robe
    feet: 212000, // Consecrated Slippers
    finger1: 215135, // Ring
    finger2: 215136, // Ring
    hands: 212006, // Consecrated Gloves
    head: 212009, // Consecrated Hood
    legs: 212004, // Consecrated Leggings
    mainHand: 222446, // Staff
    neck: 215134, // Amulet
    offHand: null, // Empty for 2H
    shoulder: 212003, // Consecrated Shoulderpads
    trinket1: 219314, // Trinket
    trinket2: 219315, // Trinket
    waist: 212002, // Consecrated Cord
    wrist: 212007, // Consecrated Cuffs
  } satisfies Record<EquipmentSlot, number | null>,

  professions: [
    { name: "Alchemy", rank: 525 },
    { name: "Herbalism", rank: 525 },
  ],

  table: {
    leaderboard: [
      { id: 1, name: "Alice", role: "Tank", score: "125,432" },
      { id: 2, name: "Bob", role: "Healer", score: "118,291" },
      { id: 3, name: "Carol", role: "DPS", score: "112,847" },
      { id: 4, name: "Dave", role: "DPS", score: "109,523" },
    ],
  },
};
