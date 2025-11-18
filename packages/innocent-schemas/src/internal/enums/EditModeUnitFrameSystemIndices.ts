import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeUnitFrameSystemIndices {
  Player = 1,
  Target = 2,
  Focus = 3,
  Party = 4,
  Raid = 5,
  Boss = 6,
  Arena = 7,
  Pet = 8,
}

export const EditModeUnitFrameSystemIndicesSchema = Schema.Enums(
  EditModeUnitFrameSystemIndices,
);
