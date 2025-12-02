import { DbcService, ExtractorService } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";

import type { AllowedFunction, FunctionMetadata } from "./schemas.js";

export const FUNCTION_METADATA: Record<AllowedFunction, FunctionMetadata> = {
  extractAuraRestrictions: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Extract aura restriction information for a spell (required/excluded auras on caster/target).",
    name: "extractAuraRestrictions",
    returns:
      "{ casterAuraSpell, casterAuraState, targetAuraSpell, targetAuraState, excludeCasterAuraSpell, excludeCasterAuraState, excludeTargetAuraSpell, excludeTargetAuraState } | null",
  },

  extractCastTime: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract cast time information for a spell.",
    name: "extractCastTime",
    returns: "{ base: number, min: number } | null",
  },

  extractCharges: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract charge information for a spell.",
    name: "extractCharges",
    returns: "{ maxCharges: number, rechargeTime: number } | null",
  },

  extractClassOptions: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract class-specific options and spell mask for a spell.",
    name: "extractClassOptions",
    returns: "{ spellClassSet, spellClassMask1-4 } | null",
  },

  extractCooldown: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract cooldown information for a spell.",
    name: "extractCooldown",
    returns: "{ category: number, gcd: number, recovery: number } | null",
  },

  extractDescription: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Get the description and aura description for a spell.",
    name: "extractDescription",
    returns: "{ description: string, auraDescription: string }",
  },

  extractDescriptionVariables: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Get the description variables string for a spell.",
    name: "extractDescriptionVariables",
    returns: "string | null",
  },

  extractDuration: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract duration information for a spell.",
    name: "extractDuration",
    returns: "{ duration: number, max: number } | null",
  },

  extractEmpower: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract Evoker empower stage information for a spell.",
    name: "extractEmpower",
    returns: "{ canEmpower: boolean, stages: Array<{ stage, durationMs }> }",
  },

  extractInterrupts: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract interrupt flags for a spell.",
    name: "extractInterrupts",
    returns:
      "{ auraInterruptFlags: [number, number], channelInterruptFlags: [number, number], interruptFlags: number } | null",
  },

  extractLearnSpells: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Extract learn spell relationships (spells learned together, spell overrides).",
    name: "extractLearnSpells",
    returns: "Array<{ learnSpellId: number, overridesSpellId: number }>",
  },

  extractLevels: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract level requirements for a spell.",
    name: "extractLevels",
    returns:
      "{ baseLevel: number, maxLevel: number, maxPassiveAuraLevel: number, spellLevel: number } | null",
  },

  extractName: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Get the display name for a spell.",
    name: "extractName",
    returns: "string (spell name)",
  },

  extractPower: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract power cost information for a spell.",
    name: "extractPower",
    returns:
      "{ powerCost: number, powerCostPct: number, powerType: number } | null",
  },

  extractRadius: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract radius information for all spell effects.",
    name: "extractRadius",
    returns: "Array<{ radius: number, min: number, max: number }>",
  },

  extractRange: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract range information for a spell.",
    name: "extractRange",
    returns: "{ ally: { min, max }, enemy: { min, max } } | null",
  },

  extractReplacement: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Get the replacement spell ID if this spell replaces another.",
    name: "extractReplacement",
    returns: "{ replacementSpellId: number } | null",
  },

  extractScaling: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract spell power and attack power scaling coefficients.",
    name: "extractScaling",
    returns: "{ attackPower: number, spellPower: number }",
  },

  extractShapeshift: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Extract shapeshift form requirements for a spell (which forms can/cannot use it).",
    name: "extractShapeshift",
    returns:
      "{ shapeshiftMask: [number, number], shapeshiftExclude: [number, number], stanceBarOrder: number } | null",
  },

  extractTargetRestrictions: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Extract target restriction information for a spell, including cone degrees, max targets, and width.",
    name: "extractTargetRestrictions",
    returns:
      "{ coneDegrees: number, maxTargetLevel: number, maxTargets: number, targetCreatureType: number, targets: number, width: number } | null",
  },

  extractTotems: {
    args: {
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description: "Extract totem requirements for a spell (Shaman).",
    name: "extractTotems",
    returns:
      "{ requiredTotemCategories: [number, number], totems: [number, number] } | null",
  },

  getDamage: {
    args: {
      contentTuningId: {
        description: "Content tuning ID (default: 1279)",
        required: false,
        type: "number",
      },
      effectIndex: {
        description: "Effect index to calculate damage for (default: 0)",
        required: false,
        type: "number",
      },
      expansion: {
        description: "Expansion ID (default: 10)",
        required: false,
        type: "number",
      },
      level: {
        description: "Player level (default: 80)",
        required: false,
        type: "number",
      },
      mythicPlusSeasonId: {
        description: "M+ season ID (default: 103)",
        required: false,
        type: "number",
      },
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Calculate spell damage using expected stats for a given level and difficulty.",
    name: "getDamage",
    returns: "number (calculated damage value)",
  },

  getEffectsForDifficulty: {
    args: {
      difficultyId: {
        description: "Difficulty ID (default: 0 for normal)",
        required: false,
        type: "number",
      },
      effectType: {
        description: "SpellEffect enum value (default: 2 for SchoolDamage)",
        required: false,
        type: "number",
      },
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Get spell effects filtered by effect type and difficulty, with fallback chain.",
    name: "getEffectsForDifficulty",
    returns: "SpellEffectRow[] (matching effects)",
  },

  getVarianceForDifficulty: {
    args: {
      difficultyId: {
        description: "Difficulty ID (default: 0 for normal)",
        required: false,
        type: "number",
      },
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Get the damage variance for a spell's effects at a given difficulty.",
    name: "getVarianceForDifficulty",
    returns: "number (variance value, 0 if none)",
  },

  hasAoeDamageEffect: {
    args: {
      difficultyId: {
        description: "Difficulty ID (default: 0 for normal)",
        required: false,
        type: "number",
      },
      spellId: { description: "The spell ID", required: true, type: "number" },
    },
    description:
      "Check if a spell has AoE damage effects (effects with radius) for a given difficulty.",
    name: "hasAoeDamageEffect",
    returns: "boolean",
  },
};

type HandlerArgs = Record<string, unknown>;
type HandlerEffect = Effect.Effect<
  unknown,
  unknown,
  DbcService | ExtractorService
>;

export const FUNCTION_HANDLERS: Record<
  AllowedFunction,
  (args: HandlerArgs) => HandlerEffect
> = {
  extractAuraRestrictions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractAuraRestrictions(
        args.spellId as number,
      );
      return Option.getOrNull(result);
    }),

  extractCastTime: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const misc = Option.fromNullable(
        yield* dbc.getSpellMisc(args.spellId as number),
      );
      const result = yield* extractor.extractCastTime(misc);
      return Option.getOrNull(result);
    }),

  extractCharges: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractCharges(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractClassOptions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractClassOptions(
        args.spellId as number,
      );
      return Option.getOrNull(result);
    }),

  extractCooldown: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractCooldown(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractDescription: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      return yield* extractor.extractDescription(args.spellId as number);
    }),

  extractDescriptionVariables: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractDescriptionVariables(
        args.spellId as number,
      );
      return Option.getOrNull(result);
    }),

  extractDuration: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const misc = Option.fromNullable(
        yield* dbc.getSpellMisc(args.spellId as number),
      );
      const result = yield* extractor.extractDuration(misc);
      return Option.getOrNull(result);
    }),

  extractEmpower: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractEmpower(args.spellId as number);
      return Option.getOrElse(result, () => ({
        canEmpower: false,
        stages: [],
      }));
    }),

  extractInterrupts: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractInterrupts(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractLearnSpells: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      return yield* extractor.extractLearnSpells(args.spellId as number);
    }),

  extractLevels: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractLevels(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractName: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      return yield* extractor.extractName(args.spellId as number);
    }),

  extractPower: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractPower(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractRadius: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const effects = yield* dbc.getSpellEffects(args.spellId as number);
      return yield* extractor.extractRadius(effects);
    }),

  extractRange: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const misc = Option.fromNullable(
        yield* dbc.getSpellMisc(args.spellId as number),
      );
      const result = yield* extractor.extractRange(misc);
      return Option.getOrNull(result);
    }),

  extractReplacement: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractReplacement(
        args.spellId as number,
      );
      return Option.getOrNull(result);
    }),

  extractScaling: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const effects = yield* dbc.getSpellEffects(args.spellId as number);
      return extractor.extractScaling(effects);
    }),

  extractShapeshift: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractShapeshift(args.spellId as number);
      return Option.getOrNull(result);
    }),

  extractTargetRestrictions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractTargetRestrictions(
        args.spellId as number,
      );

      return Option.getOrNull(result);
    }),

  extractTotems: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const result = yield* extractor.extractTotems(args.spellId as number);
      return Option.getOrNull(result);
    }),

  getDamage: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = args.spellId as number;
      const effectIndex = (args.effectIndex as number) ?? 0;

      const effects = yield* dbc.getSpellEffects(spellId);
      const effect = effects[effectIndex];

      if (!effect) {
        return 0;
      }

      const config = {
        contentTuningId: (args.contentTuningId as number) ?? 1279,
        expansion: (args.expansion as number) ?? 10,
        level: (args.level as number) ?? 80,
        mythicPlusSeasonId: (args.mythicPlusSeasonId as number) ?? 103,
      };

      return yield* extractor.getDamage(effect, config);
    }),

  getEffectsForDifficulty: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = args.spellId as number;
      const effectType = (args.effectType as number) ?? 2;
      const difficultyId = (args.difficultyId as number) ?? 0;

      const effects = yield* dbc.getSpellEffects(spellId);
      return yield* extractor.getEffectsForDifficulty(
        effects,
        effectType,
        difficultyId,
      );
    }),

  getVarianceForDifficulty: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = args.spellId as number;
      const difficultyId = (args.difficultyId as number) ?? 0;

      const effects = yield* dbc.getSpellEffects(spellId);
      return yield* extractor.getVarianceForDifficulty(effects, difficultyId);
    }),

  hasAoeDamageEffect: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = args.spellId as number;
      const difficultyId = (args.difficultyId as number) ?? 0;

      const effects = yield* dbc.getSpellEffects(spellId);
      return yield* extractor.hasAoeDamageEffect(effects, difficultyId);
    }),
};

export const getFunctionMetadata = (filter?: string): FunctionMetadata[] => {
  const allMetadata = Object.values(FUNCTION_METADATA);

  if (!filter) {
    return allMetadata;
  }

  const filtered = allMetadata.filter((meta) =>
    meta.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return filtered.length > 0 ? filtered : allMetadata;
};
