import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum LogicRelop {
  None = 0,
  Equal = 1,
  Notequal = 2,
  Lt = 3,
  Lteq = 4,
  Gt = 5,
  Gteq = 6,
}

export const LogicRelopSchema = Schema.Enums(LogicRelop);
