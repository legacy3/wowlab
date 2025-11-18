import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CharCustomizationType {
  Skin = 0,
  Face = 1,
  Hair = 2,
  HairColor = 3,
  FacialHair = 4,
  CustomOptionTattoo = 5,
  CustomOptionHorn = 6,
  CustomOptionFacewear = 7,
  CustomOptionTattooColor = 8,
  Outfit = 9,
  Facepaint = 10,
  FacepaintColor = 11,
}

export const CharCustomizationTypeSchema = Schema.Enums(CharCustomizationType);
