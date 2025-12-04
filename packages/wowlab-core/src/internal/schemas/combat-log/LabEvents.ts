import * as Schema from "effect/Schema";

/**
 * Recovery ready event - fired when a cooldown category becomes available.
 * Category 133 is the Global Cooldown.
 */
export class LabRecoveryReady extends Schema.TaggedClass<LabRecoveryReady>()(
  "LAB_RECOVERY_READY",
  {
    category: Schema.Number,
    timestamp: Schema.Number,
    triggeringSpellId: Schema.Number,
    unitGUID: Schema.String,
  },
) {}

/**
 * Union of all lab-generated events.
 */
export const LabEvent = Schema.Union(LabRecoveryReady);

export type LabEvent = Schema.Schema.Type<typeof LabEvent>;

/**
 * Check if event is a lab-generated event
 */
export const isLabEvent = (event: { _tag: string }): event is LabEvent =>
  event._tag.startsWith("LAB_");

/**
 * Check if event is a recovery ready event
 */
export const isLabRecoveryReady = (event: {
  _tag: string;
}): event is LabRecoveryReady => event._tag === "LAB_RECOVERY_READY";
