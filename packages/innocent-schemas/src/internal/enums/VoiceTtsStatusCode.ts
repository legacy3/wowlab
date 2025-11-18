import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum VoiceTtsStatusCode {
  Success = 0,
  InvalidEngineType = 1,
  EngineAllocationFailed = 2,
  NotSupported = 3,
  MaxCharactersExceeded = 4,
  UtteranceBelowMinimumDuration = 5,
  InputTextEnqueued = 6,
  SdkNotInitialized = 7,
  DestinationQueueFull = 8,
  EnqueueNotNecessary = 9,
  UtteranceNotFound = 10,
  ManagerNotFound = 11,
  InvalidArgument = 12,
  InternalError = 13,
}

export const VoiceTtsStatusCodeSchema = Schema.Enums(VoiceTtsStatusCode);
