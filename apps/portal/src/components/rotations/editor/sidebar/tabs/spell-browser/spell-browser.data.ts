import { constantCase } from "change-case";

export interface Spell {
  id: number;
  name: string;
  cooldown: number;
  gcd: boolean;
  description: string;
  school: string;
}

// Mock spell data - would come from your WoW MCP in real implementation
export const MOCK_SPELLS: Spell[] = [
  {
    id: 217200,
    name: "Barbed Shot",
    cooldown: 12,
    gcd: true,
    description: "Fire a shot that poisons your target.",
    school: "Physical",
  },
  {
    id: 19574,
    name: "Bestial Wrath",
    cooldown: 90,
    gcd: false,
    description: "Sends you and your pet into a rage.",
    school: "Physical",
  },
  {
    id: 321530,
    name: "Bloodshed",
    cooldown: 60,
    gcd: true,
    description: "Command your pet to tear into your target.",
    school: "Physical",
  },
  {
    id: 359844,
    name: "Call of the Wild",
    cooldown: 180,
    gcd: false,
    description: "Summon all your pets to fight alongside you.",
    school: "Nature",
  },
  {
    id: 193455,
    name: "Cobra Shot",
    cooldown: 0,
    gcd: true,
    description: "A quick shot causing Nature damage.",
    school: "Nature",
  },
  {
    id: 212431,
    name: "Explosive Shot",
    cooldown: 30,
    gcd: true,
    description: "Fire an explosive shot at your target.",
    school: "Fire",
  },
  {
    id: 34026,
    name: "Kill Command",
    cooldown: 7.5,
    gcd: true,
    description: "Give the command to kill.",
    school: "Physical",
  },
  {
    id: 53351,
    name: "Kill Shot",
    cooldown: 10,
    gcd: true,
    description: "You attempt to finish off a wounded target.",
    school: "Physical",
  },
  {
    id: 2643,
    name: "Multi-Shot",
    cooldown: 0,
    gcd: true,
    description: "Fires several missiles at multiple targets.",
    school: "Physical",
  },
];

export function generateSpellIdSnippet(spell: Spell): string {
  const constName = constantCase(spell.name);
  return `${constName}: ${spell.id},`;
}

export function generateCastSnippet(spell: Spell): string {
  const constName = constantCase(spell.name);
  const varName = spell.name.toLowerCase().replace(/\s+/g, "");

  if (spell.gcd) {
    return `const ${varName} = yield* tryCast(rotation, playerId, SpellIds.${constName}, targetId);
if (${varName}.cast && ${varName}.consumedGCD) {
  return;
}`;
  }
  return `yield* tryCast(rotation, playerId, SpellIds.${constName});`;
}
