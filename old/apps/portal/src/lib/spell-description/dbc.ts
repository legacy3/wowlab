import type { DbcError } from "@wowlab/core/Errors";
import type * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "@wowlab/services/Data";

export type SpellDbcData = {
  readonly spellId: number;
  readonly spellRow: Schemas.Dbc.SpellRow | undefined;
  readonly spellNameRow: Schemas.Dbc.SpellNameRow | undefined;
  readonly effects: ReadonlyArray<Schemas.Dbc.SpellEffectRow>;
  readonly misc: Schemas.Dbc.SpellMiscRow | undefined;
  readonly auraOptions: Schemas.Dbc.SpellAuraOptionsRow | undefined;
  readonly targetRestrictions:
    | Schemas.Dbc.SpellTargetRestrictionsRow
    | undefined;
  readonly power: ReadonlyArray<Schemas.Dbc.SpellPowerRow>;
  readonly duration: Schemas.Dbc.SpellDurationRow | undefined;
  readonly range: Schemas.Dbc.SpellRangeRow | undefined;
  readonly radiusByIndex: ReadonlyMap<number, Schemas.Dbc.SpellRadiusRow>;
  readonly customVariablesText: string;
  readonly customVariables: ReadonlyMap<string, string>;
};

export function parseDescriptionVariables(
  text: string,
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("$")) {
      continue;
    }

    const eq = line.indexOf("=");
    if (eq <= 1) {
      continue;
    }

    const name = line.slice(1, eq).trim();
    const value = line.slice(eq + 1).trim();

    if (name.length === 0) {
      continue;
    }

    map.set(name, value);
  }

  return map;
}

export function collectReferencedSpellIds(text: string): ReadonlySet<number> {
  const ids = new Set<number>();

  for (const m of text.matchAll(/\$(\d+)[a-zA-Z]+\d*/g)) {
    const id = Number(m[1]);

    if (Number.isFinite(id)) {
      ids.add(id);
    }
  }

  for (const m of text.matchAll(/\$@[a-zA-Z]+(\d+)/g)) {
    const id = Number(m[1]);

    if (Number.isFinite(id)) {
      ids.add(id);
    }
  }

  return ids;
}

// TODO Use SpellDataFlat for this once we have everything in it
export function loadSpellDbcData(
  spellId: number,
): Effect.Effect<SpellDbcData, DbcError, DbcService> {
  return Effect.gen(function* () {
    const dbc = yield* DbcService;

    const [
      spellRow,
      spellNameRow,
      effects,
      misc,
      auraOptions,
      targetRestrictions,
      power,
      xDescVars,
    ] = yield* Effect.all(
      [
        dbc.getById("spell", spellId),
        dbc.getById("spell_name", spellId),
        dbc.getManyByFk("spell_effect", "SpellID", spellId),
        dbc.getOneByFk("spell_misc", "SpellID", spellId),
        dbc.getOneByFk("spell_aura_options", "SpellID", spellId),
        dbc.getOneByFk("spell_target_restrictions", "SpellID", spellId),
        dbc.getManyByFk("spell_power", "SpellID", spellId),
        dbc.getManyByFk("spell_x_description_variables", "SpellID", spellId),
      ],
      { batching: true },
    );

    const duration =
      misc && misc.DurationIndex !== 0
        ? yield* dbc.getById("spell_duration", misc.DurationIndex)
        : undefined;

    const range =
      misc && misc.RangeIndex !== 0
        ? yield* dbc.getById("spell_range", misc.RangeIndex)
        : undefined;

    const radiusIndices = Array.from(
      new Set(
        effects.map((e) => e.EffectRadiusIndex_0).filter((id) => id !== 0),
      ),
    );

    const radiusRows = yield* Effect.forEach(
      radiusIndices,
      (id) => dbc.getById("spell_radius", id),
      { batching: true, concurrency: "unbounded" },
    );

    const radiusByIndex = new Map<number, Schemas.Dbc.SpellRadiusRow>();
    for (let i = 0; i < radiusIndices.length; i++) {
      const row = radiusRows[i];
      const idx = radiusIndices[i];
      if (row && idx != null) {
        radiusByIndex.set(idx, row);
      }
    }

    const firstX = xDescVars.find((x) => x.SpellDescriptionVariablesID != null);
    const varsRow =
      firstX && firstX.SpellDescriptionVariablesID != null
        ? yield* dbc.getById(
            "spell_description_variables",
            firstX.SpellDescriptionVariablesID,
          )
        : undefined;

    const customVariablesText = varsRow?.Variables ?? "";
    const customVariables = parseDescriptionVariables(customVariablesText);

    return {
      auraOptions,
      customVariables,
      customVariablesText,
      duration,
      effects,
      misc,
      power,
      radiusByIndex,
      range,
      spellId,
      spellNameRow,
      spellRow,
      targetRestrictions,
    };
  });
}
