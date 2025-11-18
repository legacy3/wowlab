import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AuctionHouseError {
  NotEnoughMoney = 0,
  HigherBid = 1,
  BidIncrement = 2,
  BidOwn = 3,
  ItemNotFound = 4,
  RestrictedAccountTrial = 5,
  HasRestriction = 6,
  IsBusy = 7,
  Unavailable = 8,
  ItemHasQuote = 9,
  DatabaseError = 10,
  MinBid = 11,
  NotEnoughItems = 12,
  RepairItem = 13,
  UsedCharges = 14,
  QuestItem = 15,
  BoundItem = 16,
  ConjuredItem = 17,
  LimitedDurationItem = 18,
  IsBag = 19,
  EquippedBag = 20,
  WrappedItem = 21,
  LootItem = 22,
  DoubleBid = 23,
  FavoritesMaxed = 24,
  ItemNotAvailable = 25,
  ItemBoundToAccountUntilEquip = 26,
}

export const AuctionHouseErrorSchema = Schema.Enums(AuctionHouseError);
