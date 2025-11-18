import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TooltipTextureAnchor {
  LeftTop = 0,
  LeftCenter = 1,
  LeftBottom = 2,
  RightTop = 3,
  RightCenter = 4,
  RightBottom = 5,
  All = 6,
}

export const TooltipTextureAnchorSchema = Schema.Enums(TooltipTextureAnchor);
