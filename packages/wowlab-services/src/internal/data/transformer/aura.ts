/**
 * Aura Transformer
 *
 * Transforms DBC spell data into AuraDataFlat.
 * Per docs/aura-system/04-phase2-transformer.md
 */
import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Aura, Branded } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

/**
 * Transform a spell into AuraDataFlat.
 *
 * Data path per docs/aura-system/04-phase2-transformer.md:
 * spellId → DbcService (spell_misc, spell_duration, spell_effect, spell_aura_options)
 *        → ExtractorService helpers
 *        → AuraDataFlat
 */
export const transformAura = (
  spellId: number,
): Effect.Effect<
  Aura.AuraDataFlat,
  Errors.SpellInfoNotFound | DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    // Validate spell exists (SpellInfoNotFound on miss)
    const nameRow = yield* dbc.getSpellName(spellId);
    if (!nameRow) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    // Fetch spell_misc for attributes and duration index
    const misc = Option.fromNullable(yield* dbc.getSpellMisc(spellId));

    // Extract attributes array from misc
    const attributes = pipe(
      misc,
      Option.map((m) => [
        m.Attributes_0,
        m.Attributes_1,
        m.Attributes_2,
        m.Attributes_3,
        m.Attributes_4,
        m.Attributes_5,
        m.Attributes_6,
        m.Attributes_7,
        m.Attributes_8,
        m.Attributes_9,
        m.Attributes_10,
        m.Attributes_11,
        m.Attributes_12,
        m.Attributes_13,
        m.Attributes_14,
        m.Attributes_15,
      ]),
      Option.getOrElse(() => [] as number[]),
    );

    // Fetch spell effects for periodic info
    const effects = yield* dbc.getSpellEffects(spellId);

    // Fetch spell_aura_options for maxStacks
    const auraOptions = yield* dbc.getSpellAuraOptions(spellId);

    // Extract duration via extractor (handles DurationIndex lookup)
    const durationOpt = yield* extractor.extractDuration(misc);

    // Extract periodic info from effects
    const periodicInfo = extractor.extractPeriodicInfo(effects);

    // Extract aura flags from attributes
    const auraFlags = extractor.extractAuraFlags(attributes);

    // Determine refresh behavior
    const refreshBehavior = extractor.determineRefreshBehavior(
      auraFlags.pandemicRefresh,
      periodicInfo.tickPeriodMs,
    );

    // Build AuraDataFlat per docs/aura-system/04-phase2-transformer.md mapping table
    const auraData: Aura.AuraDataFlat = {
      spellId: Branded.SpellID(spellId),

      // Duration from spell_duration via misc DurationIndex
      // Default to 0 when missing
      baseDurationMs: Option.isSome(durationOpt)
        ? durationOpt.value.duration
        : 0,
      maxDurationMs: Option.isSome(durationOpt) ? durationOpt.value.max : 0,

      // Max stacks from spell_aura_options.CumulativeAura (0→1 per docs)
      maxStacks: auraOptions?.CumulativeAura ? auraOptions.CumulativeAura : 1,

      // Periodic info from spell_effect
      periodicType: periodicInfo.periodicType,
      tickPeriodMs: periodicInfo.tickPeriodMs,

      // Refresh behavior derived from flags
      refreshBehavior,

      // Flags from attributes
      durationHasted: auraFlags.durationHasted,
      hastedTicks: auraFlags.hastedTicks,
      pandemicRefresh: auraFlags.pandemicRefresh,
      rollingPeriodic: auraFlags.rollingPeriodic,
      tickMayCrit: auraFlags.tickMayCrit,
      tickOnApplication: auraFlags.tickOnApplication,
    };

    return auraData;
  });
