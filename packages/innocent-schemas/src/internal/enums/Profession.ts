import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum Profession {
  FirstAid = 0,
  Blacksmithing = 1,
  Leatherworking = 2,
  Alchemy = 3,
  Herbalism = 4,
  Cooking = 5,
  Mining = 6,
  Tailoring = 7,
  Engineering = 8,
  Enchanting = 9,
  Fishing = 10,
  Skinning = 11,
  Jewelcrafting = 12,
  Inscription = 13,
  Archaeology = 14,
}

export const ProfessionSchema = Schema.Enums(Profession);
