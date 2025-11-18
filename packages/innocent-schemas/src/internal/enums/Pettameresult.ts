import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum Pettameresult {
  Ok = 0,
  Invalidcreature = 1,
  Toomany = 2,
  Creaturealreadyowned = 3,
  Nottameable = 4,
  Anothersummonactive = 5,
  Unitscanttame = 6,
  Nopetavailable = 7,
  Internalerror = 8,
  Toohighlevel = 9,
  Dead = 10,
  Notdead = 11,
  Cantcontrolexotic = 12,
  Invalidslot = 13,
  EliteToohighlevel = 14,
  Numresults = 15,
}

export const PettameresultSchema = Schema.Enums(Pettameresult);
