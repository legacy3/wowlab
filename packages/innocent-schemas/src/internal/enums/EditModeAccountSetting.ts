import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum EditModeAccountSetting {
  ShowGrid = 0,
  GridSpacing = 1,
  SettingsExpanded = 2,
  ShowTargetAndFocus = 3,
  ShowStanceBar = 4,
  ShowPetActionBar = 5,
  ShowPossessActionBar = 6,
  ShowCastBar = 7,
  ShowEncounterBar = 8,
  ShowExtraAbilities = 9,
  ShowBuffsAndDebuffs = 10,
  DeprecatedShowDebuffFrame = 11,
  ShowPartyFrames = 12,
  ShowRaidFrames = 13,
  ShowTalkingHeadFrame = 14,
  ShowVehicleLeaveButton = 15,
  ShowBossFrames = 16,
  ShowArenaFrames = 17,
  ShowLootFrame = 18,
  ShowHudTooltip = 19,
  ShowStatusTrackingBar2 = 20,
  ShowDurabilityFrame = 21,
  EnableSnap = 22,
  EnableAdvancedOptions = 23,
  ShowPetFrame = 24,
  ShowTimerBars = 25,
  ShowVehicleSeatIndicator = 26,
  ShowArchaeologyBar = 27,
  ShowCooldownViewer = 28,
}

export const EditModeAccountSettingSchema = Schema.Enums(
  EditModeAccountSetting,
);
