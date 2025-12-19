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

const numberArg = (
  args: HandlerArgs,
  key: string,
  options?: { defaultValue?: number; required?: boolean },
): Effect.Effect<number, Error> =>
  Effect.sync(() => {
    const raw = args[key];

    if (raw === undefined || raw === null) {
      if (options?.required) {
        throw new Error(`Missing required arg '${key}'`);
      }

      if (options?.defaultValue != null) {
        return options.defaultValue;
      }

      throw new Error(`Missing arg '${key}'`);
    }

    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`Arg '${key}' must be a finite number`);
    }

    return value;
  });

export const FUNCTION_HANDLERS: Record<
  AllowedFunction,
  (args: HandlerArgs) => HandlerEffect
> = {
  extractAuraRestrictions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractAuraRestrictions(spellId);
      return Option.getOrNull(result);
    }),

  extractCastTime: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const misc = Option.fromNullable(
        yield* dbc.getOneByFk("spell_misc", "SpellID", spellId),
      );
      const result = yield* extractor.extractCastTime(misc);
      return Option.getOrNull(result);
    }),

  extractCharges: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractCharges(spellId);
      return Option.getOrNull(result);
    }),

  extractClassOptions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractClassOptions(spellId);
      return Option.getOrNull(result);
    }),

  extractCooldown: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractCooldown(spellId);
      return Option.getOrNull(result);
    }),

  extractDescription: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      return yield* extractor.extractDescription(spellId);
    }),

  extractDescriptionVariables: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractDescriptionVariables(spellId);
      return Option.getOrNull(result);
    }),

  extractDuration: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const misc = Option.fromNullable(
        yield* dbc.getOneByFk("spell_misc", "SpellID", spellId),
      );
      const result = yield* extractor.extractDuration(misc);
      return Option.getOrNull(result);
    }),

  extractEmpower: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractEmpower(spellId);
      return Option.getOrElse(result, () => ({
        canEmpower: false,
        stages: [],
      }));
    }),

  extractInterrupts: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractInterrupts(spellId);
      return Option.getOrNull(result);
    }),

  extractLearnSpells: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      return yield* extractor.extractLearnSpells(spellId);
    }),

  extractLevels: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractLevels(spellId);
      return Option.getOrNull(result);
    }),

  extractName: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      return yield* extractor.extractName(spellId);
    }),

  extractPower: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractPower(spellId);
      return Option.getOrNull(result);
    }),

  extractRadius: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
      return yield* extractor.extractRadius(effects);
    }),

  extractRange: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const misc = Option.fromNullable(
        yield* dbc.getOneByFk("spell_misc", "SpellID", spellId),
      );
      const result = yield* extractor.extractRange(misc);
      return Option.getOrNull(result);
    }),

  extractReplacement: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractReplacement(spellId);
      return Option.getOrNull(result);
    }),

  extractScaling: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
      return extractor.extractScaling(effects);
    }),

  extractShapeshift: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractShapeshift(spellId);
      return Option.getOrNull(result);
    }),

  extractTargetRestrictions: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractTargetRestrictions(spellId);

      return Option.getOrNull(result);
    }),

  extractTotems: (args) =>
    Effect.gen(function* () {
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const result = yield* extractor.extractTotems(spellId);
      return Option.getOrNull(result);
    }),

  getDamage: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const effectIndex = yield* numberArg(args, "effectIndex", {
        defaultValue: 0,
      });

      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
      const effect = effects[effectIndex];

      if (!effect) {
        return 0;
      }

      const config = {
        contentTuningId: yield* numberArg(args, "contentTuningId", {
          defaultValue: 1279,
        }),
        expansion: yield* numberArg(args, "expansion", { defaultValue: 10 }),
        level: yield* numberArg(args, "level", { defaultValue: 80 }),
        mythicPlusSeasonId: yield* numberArg(args, "mythicPlusSeasonId", {
          defaultValue: 103,
        }),
      };

      return yield* extractor.getDamage(effect, config);
    }),

  getEffectsForDifficulty: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const effectType = yield* numberArg(args, "effectType", {
        defaultValue: 2,
      });
      const difficultyId = yield* numberArg(args, "difficultyId", {
        defaultValue: 0,
      });

      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
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
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const difficultyId = yield* numberArg(args, "difficultyId", {
        defaultValue: 0,
      });

      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
      return yield* extractor.getVarianceForDifficulty(effects, difficultyId);
    }),

  hasAoeDamageEffect: (args) =>
    Effect.gen(function* () {
      const dbc = yield* DbcService;
      const extractor = yield* ExtractorService;
      const spellId = yield* numberArg(args, "spellId", { required: true });
      const difficultyId = yield* numberArg(args, "difficultyId", {
        defaultValue: 0,
      });

      const effects = yield* dbc.getManyByFk(
        "spell_effect",
        "SpellID",
        spellId,
      );
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
