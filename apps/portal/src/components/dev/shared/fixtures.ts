import type { Character, Item, Profession, Slot } from "@/lib/sim";

export const fixtures = {
  character: {
    class: "shaman",
    level: 80,
    name: "Wellenwilli",
    professions: [],
    race: "Tauren",
    region: "eu",
    server: "Blackmoore",
    spec: "Restoration",
  } satisfies Character,

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

  equipment: [
    { id: 212009, slot: "head" as Slot },
    { id: 215134, slot: "neck" as Slot },
    { id: 212003, slot: "shoulder" as Slot },
    { id: 222817, slot: "back" as Slot },
    { id: 212011, slot: "chest" as Slot },
    { id: 212007, slot: "wrist" as Slot },
    { id: 212006, slot: "hands" as Slot },
    { id: 212002, slot: "waist" as Slot },
    { id: 212004, slot: "legs" as Slot },
    { id: 212000, slot: "feet" as Slot },
    { id: 215135, slot: "finger1" as Slot },
    { id: 215136, slot: "finger2" as Slot },
    { id: 219314, slot: "trinket1" as Slot },
    { id: 219315, slot: "trinket2" as Slot },
    { id: 222446, slot: "main_hand" as Slot },
  ] satisfies Item[],

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

  professions: [
    { name: "Alchemy", rank: 525 },
    { name: "Herbalism", rank: 525 },
  ] satisfies Profession[],

  table: {
    leaderboard: [
      { id: 1, name: "Alice", role: "Tank", score: "125,432" },
      { id: 2, name: "Bob", role: "Healer", score: "118,291" },
      { id: 3, name: "Carol", role: "DPS", score: "112,847" },
      { id: 4, name: "Dave", role: "DPS", score: "109,523" },
    ],
  },
};
