// Rhai script snippets for the Rust simulation engine

export interface Snippet {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const SNIPPETS: Snippet[] = [
  {
    id: "rotation-template",
    name: "Rotation Template",
    description: "Basic Rhai rotation structure",
    code: `// Priority-based rotation: first matching rule wins
if bestial_wrath.ready() { cast("bestial_wrath") }
if kill_command.ready() { cast("kill_command") }
if barbed_shot.ready() { cast("barbed_shot") }
if cobra_shot.ready() { cast("cobra_shot") }`,
  },
  {
    id: "spell-ready-check",
    name: "Spell Ready Check",
    description: "Check if spell is off cooldown and castable",
    code: `if spell_name.ready() { cast("spell_name") }`,
  },
  {
    id: "aura-active-check",
    name: "Aura Active Check",
    description: "Check if an aura/buff is currently active",
    code: `if aura_name.active() { cast("spell_name") }`,
  },
  {
    id: "aura-stacks-check",
    name: "Aura Stacks Check",
    description: "Check if aura has minimum stacks",
    code: `if aura_name.stacks() >= 3 { cast("spell_name") }`,
  },
  {
    id: "aura-remaining-check",
    name: "Aura Remaining Check",
    description: "Check if aura is about to expire",
    code: `if aura_name.remaining() <= 4.0 { cast("refresh_spell") }`,
  },
  {
    id: "cooldown-section",
    name: "Cooldowns Section",
    description: "Major cooldowns at the start of priority",
    code: `// Major cooldowns
if major_cooldown.ready() { cast("major_cooldown") }
if minor_cooldown.ready() { cast("minor_cooldown") }`,
  },
  {
    id: "filler-section",
    name: "Filler Section",
    description: "Filler spell at lowest priority",
    code: `// Filler (always ready, lowest priority)
if filler_spell.ready() { cast("filler_spell") }`,
  },
  {
    id: "conditional-cast",
    name: "Conditional Cast",
    description: "Cast based on multiple conditions",
    code: `// Cast only when buff is active and spell is ready
if buff_name.active() && spell_name.ready() {
  cast("spell_name")
}`,
  },
];
