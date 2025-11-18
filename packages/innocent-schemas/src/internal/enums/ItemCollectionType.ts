import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemCollectionType {
  ItemCollectionNone = 0,
  ItemCollectionToy = 1,
  ItemCollectionHeirloom = 2,
  ItemCollectionTransmog = 3,
  ItemCollectionTransmogSetFavorite = 4,
  ItemCollectionRuneforgeLegendaryAbility = 5,
  ItemCollectionTransmogIllusion = 6,
  ItemCollectionWarbandScene = 7,
  ItemCollectionRoom = 8,
  ItemCollectionExteriorFixture = 9,
  ItemCollectionRoomThemes = 10,
  ItemCollectionRoomMaterials = 11,
  NumItemCollectionTypes = 11,
}

export const ItemCollectionTypeSchema = Schema.Enums(ItemCollectionType);
