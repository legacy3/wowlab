import type { CstNode, IToken } from "chevrotain";

import type {
  SimcCharacter,
  SimcItem,
  SimcProfession,
  SimcProfile,
  SimcSavedLoadout,
  SimcSlot,
  SimcTalents,
  WowClass,
} from "./types";

import { simcParser } from "./parser";

const BaseSimcVisitor = simcParser.getBaseCstVisitorConstructor();

const WOW_CLASSES = new Set<string>([
  "death_knight",
  "demon_hunter",
  "druid",
  "evoker",
  "hunter",
  "mage",
  "monk",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
]);

const EQUIPMENT_SLOTS = new Set<string>([
  "back",
  "chest",
  "feet",
  "finger1",
  "finger2",
  "hands",
  "head",
  "legs",
  "main_hand",
  "neck",
  "off_hand",
  "shoulder",
  "trinket1",
  "trinket2",
  "waist",
  "wrist",
]);

interface VisitorContext {
  assignments: Map<string, string>;
  characterName?: string;
  equipment: SimcItem[];
  savedLoadouts: SimcSavedLoadout[];
  wowClass?: WowClass;
}

class SimcCstVisitor extends BaseSimcVisitor {
  constructor() {
    super();

    this.validateVisitor();
  }

  assignment(
    ctx: { key?: IToken[]; value?: CstNode[]; assignmentToken?: IToken[] },
    inherited: VisitorContext,
  ): void {
    let key: string | undefined;
    let value: string = "";

    if (ctx.assignmentToken) {
      const raw = ctx.assignmentToken[0].image;
      const [k, ...rest] = raw.split("=");

      key = k;
      value = rest.join("=");
    } else if (ctx.key && ctx.value) {
      key = ctx.key[0].image;

      const valueNode = ctx.value[0];
      value = this.visit(valueNode);
    }

    if (!key) {
      return;
    }

    // class definition uses class name as key (e.g. warrior="Charname")
    if (WOW_CLASSES.has(key)) {
      inherited.wowClass = key as WowClass;
      inherited.characterName = value.replace(/^"|"$/g, "");
    } else {
      inherited.assignments.set(key, value);
    }
  }

  colonSeparatedList(ctx: { values: CstNode[] }): string[] {
    return ctx.values.map((v) => this.visit(v) as string);
  }

  equipmentLine(
    ctx: { slot: IToken[]; keyValuePair: CstNode[] },
    inherited: VisitorContext,
  ): void {
    const slot = ctx.slot[0].image;

    if (!EQUIPMENT_SLOTS.has(slot)) {
      return;
    }

    const kvPairs = new Map<string, string | string[]>();
    for (const kvNode of ctx.keyValuePair) {
      const { key, value } = this.visit(kvNode) as {
        key: string;
        value: string | string[];
      };

      kvPairs.set(key, value);
    }

    const idStr = kvPairs.get("id");
    if (!idStr || Array.isArray(idStr)) {
      return;
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return;
    }

    const item: SimcItem = {
      bonusIds: parseNumberList(kvPairs.get("bonus_id")),
      craftedStats: parseNumberList(kvPairs.get("crafted_stats")),
      craftingQuality: parseOptionalNumber(kvPairs.get("crafting_quality")),
      enchantId: parseOptionalNumber(kvPairs.get("enchant_id")),
      gemIds: parseNumberList(kvPairs.get("gem_id")),
      id,
      slot: slot as SimcSlot,
    };

    inherited.equipment.push(item);
  }

  keyValuePair(ctx: {
    key: IToken[];
    value?: CstNode[];
    slashSeparatedList?: CstNode[];
    colonSeparatedList?: CstNode[];
    kvToken?: IToken[];
  }): { key: string; value: string | string[] } {
    if (ctx.kvToken) {
      const raw = ctx.kvToken[0].image;
      const [key, ...rest] = raw.split("=");
      const value = rest.join("=");

      return {
        key,
        value: value.includes("/") ? value.split("/") : value,
      };
    }

    const key = ctx.key[0].image;

    if (ctx.slashSeparatedList) {
      const values = this.visit(ctx.slashSeparatedList) as string[];

      return { key, value: values };
    }

    if (ctx.colonSeparatedList) {
      const values = this.visit(ctx.colonSeparatedList) as string[];

      return { key, value: values };
    }

    if (ctx.value) {
      const value = this.visit(ctx.value);

      return { key, value };
    }

    return { key, value: "" };
  }

  line(
    ctx: { assignment?: CstNode[]; equipmentLine?: CstNode[] },
    inherited: VisitorContext,
  ): void {
    if (ctx.assignment) {
      this.visit(ctx.assignment, inherited);
    }

    if (ctx.equipmentLine) {
      this.visit(ctx.equipmentLine, inherited);
    }
  }

  profile(ctx: { line?: CstNode[] }): VisitorContext {
    const result: VisitorContext = {
      assignments: new Map(),
      equipment: [],
      savedLoadouts: [],
    };

    if (ctx.line) {
      for (const lineNode of ctx.line) {
        this.visit(lineNode, result);
      }
    }

    return result;
  }

  slashSeparatedList(ctx: { values: CstNode[] }): string[] {
    return ctx.values.map((v) => this.visit(v) as string);
  }

  value(ctx: {
    QuotedString?: IToken[];
    Identifier?: IToken[];
    Integer?: IToken[];
    ComplexValue?: IToken[];
    UnquotedValue?: IToken[];
  }): string {
    if (ctx.QuotedString) {
      return ctx.QuotedString[0].image;
    }

    if (ctx.Integer) {
      return ctx.Integer[0].image;
    }

    if (ctx.Identifier) {
      return ctx.Identifier[0].image;
    }

    if (ctx.ComplexValue) {
      return ctx.ComplexValue[0].image;
    }

    if (ctx.UnquotedValue) {
      return ctx.UnquotedValue[0].image;
    }

    return "";
  }
}

export function parseSavedLoadoutsFromInput(input: string): SimcSavedLoadout[] {
  const loadouts: SimcSavedLoadout[] = [];
  let pendingName: string | undefined;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("#")) {
      continue;
    }

    const nameMatch = line.match(/^#\\s*Saved\\s+Loadout:\\s*(.+)$/i);
    if (nameMatch) {
      pendingName = nameMatch[1].trim();
      continue;
    }

    const talentMatch = line.match(/^#\\s*talents\\s*=\\s*(\\S+)/i);
    if (talentMatch && pendingName) {
      loadouts.push({ encoded: talentMatch[1], name: pendingName });
      pendingName = undefined;
    }
  }

  return loadouts;
}

function formatProfessionName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRace(race: string): string {
  return race
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSpec(spec: string): string {
  return spec
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseNumberList(
  value: string | string[] | undefined,
): readonly number[] | undefined {
  if (!value) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const numbers = values.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n));

  if (numbers.length > 0) {
    return numbers;
  }

  return undefined;
}

function parseOptionalNumber(
  value: string | string[] | undefined,
): number | undefined {
  if (!value || Array.isArray(value)) return undefined;
  const num = parseInt(value, 10);

  return isNaN(num) ? undefined : num;
}

// format: "alchemy=27/jewelcrafting=100"
function parseProfessions(
  profStr: string | undefined,
): readonly SimcProfession[] {
  if (!profStr) {
    return [];
  }

  const parts = profStr.split("/");
  const professions: SimcProfession[] = [];

  for (const part of parts) {
    const [name, rankStr] = part.split("=");

    if (name && rankStr) {
      const rank = parseInt(rankStr, 10);

      if (!isNaN(rank)) {
        professions.push({ name: formatProfessionName(name), rank });
      }
    }
  }

  return professions;
}

export const simcVisitor = new SimcCstVisitor();

export function transformToProfile(
  visitorResult: VisitorContext,
  opts?: { savedLoadouts?: readonly SimcSavedLoadout[] },
): SimcProfile {
  const { assignments, characterName, equipment, wowClass } = visitorResult;

  if (!wowClass || !characterName) {
    throw new Error("Invalid SimC profile: missing class or character name");
  }

  const character: SimcCharacter = {
    level: parseInt(assignments.get("level") ?? "80", 10),
    name: characterName,
    professions: parseProfessions(assignments.get("professions")),
    race: formatRace(assignments.get("race") ?? "unknown"),
    region: assignments.get("region")?.toUpperCase(),
    role: assignments.get("role"),
    server: assignments.get("server"),
    spec: formatSpec(assignments.get("spec") ?? "unknown"),
    wowClass,
  };

  const talents: SimcTalents = {
    encoded: assignments.get("talents") ?? "",
    savedLoadouts: opts?.savedLoadouts ?? [],
  };

  return {
    character,
    equipment,
    rawAssignments: assignments,
    talents,
  };
}
