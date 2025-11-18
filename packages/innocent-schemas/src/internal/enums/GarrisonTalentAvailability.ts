import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum GarrisonTalentAvailability {
  Available = 0,
  Unavailable = 1,
  UnavailableAnotherIsResearching = 2,
  UnavailableNotEnoughResources = 3,
  UnavailableNotEnoughGold = 4,
  UnavailableTierUnavailable = 5,
  UnavailablePlayerCondition = 6,
  UnavailableAlreadyHave = 7,
  UnavailableRequiresPrerequisiteTalent = 8,
}

export const GarrisonTalentAvailabilitySchema = Schema.Enums(
  GarrisonTalentAvailability,
);
