"use client";

export type SpellSchool =
  | "physical"
  | "fire"
  | "nature"
  | "frost"
  | "shadow"
  | "arcane"
  | "holy";

export interface SpellInfo {
  readonly id: number;
  readonly name: string;
  readonly icon: string;
  readonly school: SpellSchool;
  readonly color: string;
}

export const SPELLS: Record<number, SpellInfo> = {
  34026: {
    id: 34026,
    name: "Kill Command",
    icon: "ability_hunter_killcommand",
    school: "physical",
    color: "#7C3AED",
  },
  193455: {
    id: 193455,
    name: "Cobra Shot",
    icon: "ability_hunter_cobrashot",
    school: "nature",
    color: "#0EA5E9",
  },
  217200: {
    id: 217200,
    name: "Barbed Shot",
    icon: "ability_hunter_barbedshot",
    school: "physical",
    color: "#F97316",
  },
  19574: {
    id: 19574,
    name: "Bestial Wrath",
    icon: "ability_druid_ferociousbite",
    school: "physical",
    color: "#22C55E",
  },
  359844: {
    id: 359844,
    name: "Call of the Wild",
    icon: "ability_hunter_callofthewild",
    school: "nature",
    color: "#EAB308",
  },
  186265: {
    id: 186265,
    name: "Aspect of the Turtle",
    icon: "ability_hunter_aspectoftheturtle",
    school: "nature",
    color: "#06B6D4",
  },
  321530: {
    id: 321530,
    name: "Bloodshed",
    icon: "ability_hunter_bloodshed",
    school: "physical",
    color: "#EF4444",
  },
  53351: {
    id: 53351,
    name: "Kill Shot",
    icon: "ability_hunter_assassinate2",
    school: "physical",
    color: "#DC2626",
  },
  120360: {
    id: 120360,
    name: "Barrage",
    icon: "ability_hunter_barrage",
    school: "physical",
    color: "#8B5CF6",
  },
  147362: {
    id: 147362,
    name: "Counter Shot",
    icon: "ability_hunter_countershot",
    school: "physical",
    color: "#F59E0B",
  },
  83381: {
    id: 83381,
    name: "Kill Command (Pet)",
    icon: "ability_hunter_killcommand",
    school: "physical",
    color: "#7C3AED",
  },
  272790: {
    id: 272790,
    name: "Frenzy",
    icon: "ability_hunter_pet_frenzy",
    school: "physical",
    color: "#F97316",
  },
  281036: {
    id: 281036,
    name: "Thrill of the Hunt",
    icon: "ability_hunter_thrillofthehunt",
    school: "physical",
    color: "#10B981",
  },
  393777: {
    id: 393777,
    name: "Dire Pack",
    icon: "ability_hunter_direpack",
    school: "nature",
    color: "#84CC16",
  },
};

export const SCHOOL_COLORS: Record<SpellSchool, string> = {
  physical: "#FFCC00",
  fire: "#FF8000",
  nature: "#4DFF4D",
  frost: "#80FFFF",
  shadow: "#9966FF",
  arcane: "#FF66FF",
  holy: "#FFE680",
};

export function getSpell(spellId: number): SpellInfo | undefined {
  return SPELLS[spellId];
}
