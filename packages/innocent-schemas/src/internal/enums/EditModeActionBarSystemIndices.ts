import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeActionBarSystemIndices {
  MainBar = 1,
  Bar2 = 2,
  Bar3 = 3,
  RightBar1 = 4,
  RightBar2 = 5,
  ExtraBar1 = 6,
  ExtraBar2 = 7,
  ExtraBar3 = 8,
  StanceBar = 11,
  PetActionBar = 12,
  PossessActionBar = 13,
}

export const EditModeActionBarSystemIndicesSchema = Schema.Enums(
  EditModeActionBarSystemIndices,
);
