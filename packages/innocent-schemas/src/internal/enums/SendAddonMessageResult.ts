import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum SendAddonMessageResult {
  Success = 0,
  InvalidPrefix = 1,
  InvalidMessage = 2,
  AddonMessageThrottle = 3,
  InvalidChatType = 4,
  NotInGroup = 5,
  TargetRequired = 6,
  InvalidChannel = 7,
  ChannelThrottle = 8,
  GeneralError = 9,
  NotInGuild = 10,
}

export const SendAddonMessageResultSchema = Schema.Enums(
  SendAddonMessageResult,
);
