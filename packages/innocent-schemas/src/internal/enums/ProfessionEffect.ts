import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ProfessionEffect {
  Skill = 0,
  StatInspiration = 1,
  StatResourcefulness = 2,
  StatFinesse = 3,
  StatDeftness = 4,
  StatPerception = 5,
  StatCraftingSpeed = 6,
  StatMulticraft = 7,
  UnlockReagentSlot = 8,
  ModInspiration = 9,
  ModResourcefulness = 10,
  ModFinesse = 11,
  ModDeftness = 12,
  ModPerception = 13,
  ModCraftingSpeed = 14,
  ModMulticraft = 15,
  ModUnused_1 = 16,
  ModUnused_2 = 17,
  ModCraftExtraQuantity = 18,
  ModGatherExtraQuantity = 19,
  ModCraftCritSize = 20,
  ModCraftReductionQuantity = 21,
  DecreaseDifficulty = 22,
  IncreaseDifficulty = 23,
  ModSkillGain = 24,
  AccumulateRanksByLabel = 25,
  StatIngenuity = 26,
  ModConcentration = 27,
  Tokenizer = 28,
  ModIngenuity = 29,
  ConcentrationRefund = 30,
}

export const ProfessionEffectSchema = Schema.Enums(ProfessionEffect);
