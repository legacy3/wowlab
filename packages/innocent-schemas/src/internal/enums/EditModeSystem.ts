import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeSystem {
  ActionBar = 0,
  CastBar = 1,
  Minimap = 2,
  UnitFrame = 3,
  EncounterBar = 4,
  ExtraAbilities = 5,
  AuraFrame = 6,
  TalkingHeadFrame = 7,
  ChatFrame = 8,
  VehicleLeaveButton = 9,
  LootFrame = 10,
  HudTooltip = 11,
  ObjectiveTracker = 12,
  MicroMenu = 13,
  Bags = 14,
  StatusTrackingBar = 15,
  DurabilityFrame = 16,
  TimerBars = 17,
  VehicleSeatIndicator = 18,
  ArchaeologyBar = 19,
  CooldownViewer = 20,
}

export const EditModeSystemSchema = Schema.Enums(EditModeSystem);
