import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum VoiceChatStatusCode {
  Success = 0,
  OperationPending = 1,
  TooManyRequests = 2,
  LoginProhibited = 3,
  ClientNotInitialized = 4,
  ClientNotLoggedIn = 5,
  ClientAlreadyLoggedIn = 6,
  ChannelNameTooShort = 7,
  ChannelNameTooLong = 8,
  ChannelAlreadyExists = 9,
  AlreadyInChannel = 10,
  TargetNotFound = 11,
  Failure = 12,
  ServiceLost = 13,
  UnableToLaunchProxy = 14,
  ProxyConnectionTimeOut = 15,
  ProxyConnectionUnableToConnect = 16,
  ProxyConnectionUnexpectedDisconnect = 17,
  Disabled = 18,
  UnsupportedChatChannelType = 19,
  InvalidCommunityStream = 20,
  PlayerSilenced = 21,
  PlayerVoiceChatParentalDisabled = 22,
  InvalidInputDevice = 23,
  InvalidOutputDevice = 24,
}

export const VoiceChatStatusCodeSchema = Schema.Enums(VoiceChatStatusCode);
