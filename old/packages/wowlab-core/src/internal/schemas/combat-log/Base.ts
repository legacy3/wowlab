/**
 * Combat Log Base Schema
 *
 * Base fields present on all combat log events (11 fields).
 * Reference: https://warcraft.wiki.gg/wiki/COMBAT_LOG_EVENT
 */
import * as Schema from "effect/Schema";

/**
 * Base fields present on all combat log events.
 * These 11 fields appear in every CLEU event.
 */
export class CombatLogEventBase extends Schema.Class<CombatLogEventBase>(
  "CombatLogEventBase",
)({
  /** Unix time with ms precision (e.g., 1555749627.861) */
  timestamp: Schema.Number,
  /** Source is hidden */
  hideCaster: Schema.Boolean,
  /** Source unit GUID */
  sourceGUID: Schema.String,
  /** Source unit name */
  sourceName: Schema.String,
  /** Unit type/controller/reaction flags */
  sourceFlags: Schema.Number,
  /** Raid marker flags */
  sourceRaidFlags: Schema.Number,
  /** Destination unit GUID */
  destGUID: Schema.String,
  /** Destination unit name */
  destName: Schema.String,
  /** Unit flags */
  destFlags: Schema.Number,
  /** Raid marker flags */
  destRaidFlags: Schema.Number,
}) {}
