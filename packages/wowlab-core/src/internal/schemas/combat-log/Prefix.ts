/**
 * Combat Log Prefix Schemas
 *
 * Event prefixes add additional context to events.
 * Reference: https://warcraft.wiki.gg/wiki/COMBAT_LOG_EVENT
 */
import * as Schema from "effect/Schema";

import { EnvironmentalType } from "../Enums.js";

/**
 * ENVIRONMENTAL prefix fields.
 * Added for environmental damage events.
 */
export class EnvironmentalPrefix extends Schema.Class<EnvironmentalPrefix>(
  "EnvironmentalPrefix",
)({
  /** Type of environmental damage */
  environmentalType: EnvironmentalType,
}) {}

/**
 * SPELL, SPELL_PERIODIC, SPELL_BUILDING, RANGE prefix fields.
 * Added as params 12-14 for spell-based events.
 */
export class SpellPrefix extends Schema.Class<SpellPrefix>("SpellPrefix")({
  /** The spell ID */
  spellId: Schema.Number,
  /** The spell name */
  spellName: Schema.String,
  /** Spell school bitmask */
  spellSchool: Schema.Number,
}) {}
