import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum WarbandSceneAnimationEvent {
  StartingPose = 0,
  Idle = 1,
  Mouseover = 2,
  Select = 3,
  Deselect = 4,
  Insert = 5,
  EnterWorld = 6,
  Spin = 7,
  Poke = 8,
  Ffx = 9,
}

export const WarbandSceneAnimationEventSchema = Schema.Enums(
  WarbandSceneAnimationEvent,
);
