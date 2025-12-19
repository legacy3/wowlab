import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Aura, Branded } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

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

    const nameRow = yield* dbc.getById("spell_name", spellId);
    if (!nameRow) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const [misc, effects, auraOptions] = yield* Effect.all(
      [
        dbc.getOneByFk("spell_misc", "SpellID", spellId),
        dbc.getManyByFk("spell_effect", "SpellID", spellId),
        dbc.getOneByFk("spell_aura_options", "SpellID", spellId),
      ],
      { batching: true },
    );

    const miscOpt = Option.fromNullable(misc);

    const attributes = pipe(
      miscOpt,
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

    const durationOpt = yield* extractor.extractDuration(miscOpt);

    const periodicInfo = extractor.extractPeriodicInfo(effects);
    const auraFlags = extractor.extractAuraFlags(attributes);
    const refreshBehavior = extractor.determineRefreshBehavior(
      auraFlags.pandemicRefresh,
      periodicInfo.tickPeriodMs,
    );

    return {
      baseDurationMs: Option.isSome(durationOpt)
        ? durationOpt.value.duration
        : 0,
      durationHasted: auraFlags.durationHasted,
      hastedTicks: auraFlags.hastedTicks,
      maxDurationMs: Option.isSome(durationOpt) ? durationOpt.value.max : 0,
      maxStacks: auraOptions?.CumulativeAura ? auraOptions.CumulativeAura : 1,
      pandemicRefresh: auraFlags.pandemicRefresh,
      periodicType: periodicInfo.periodicType,
      refreshBehavior,
      rollingPeriodic: auraFlags.rollingPeriodic,
      spellId: Branded.SpellID(spellId),
      tickMayCrit: auraFlags.tickMayCrit,
      tickOnApplication: auraFlags.tickOnApplication,
      tickPeriodMs: periodicInfo.tickPeriodMs,
    };
  });
