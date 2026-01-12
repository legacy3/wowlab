/**
 * Sample content for dev/demo components.
 * Keeps demo code clean by centralizing example data.
 */

export const fixtures = {
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

  table: {
    leaderboard: [
      { id: 1, name: "Alice", role: "Tank", score: "125,432" },
      { id: 2, name: "Bob", role: "Healer", score: "118,291" },
      { id: 3, name: "Carol", role: "DPS", score: "112,847" },
      { id: 4, name: "Dave", role: "DPS", score: "109,523" },
    ],
  },
};
