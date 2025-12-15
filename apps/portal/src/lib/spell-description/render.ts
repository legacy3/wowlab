import type { DbcError } from "@wowlab/core/Errors";
import type { PlayerContext } from "@wowlab/parsers/SpellDescription";
import * as Effect from "effect/Effect";

import { DbcService } from "@wowlab/services/Data";
import {
  collectReferencedSpellIds,
  loadSpellDbcData,
  type SpellDbcData,
} from "./dbc";
import { buildEnv, renderWithEnv } from "./visitor";
import {
  DEFAULT_PLAYER,
  type RenderedSpellDescription,
  type SpellDescriptionKind,
} from "./types";

function toMapEntry(s: SpellDbcData): [number, SpellDbcData] {
  return [s.spellId, s];
}

export function renderSpellDescription(
  spellId: number,
  kind: SpellDescriptionKind = "description",
  player: PlayerContext = DEFAULT_PLAYER,
): Effect.Effect<RenderedSpellDescription, DbcError, DbcService> {
  return Effect.gen(function* () {
    const current = yield* loadSpellDbcData(spellId);

    const referenced = new Set<number>();
    referenced.add(spellId);

    const mainText =
      kind === "auraDescription"
        ? current.spellRow?.AuraDescription_lang
        : current.spellRow?.Description_lang;

    if (mainText) {
      for (const id of collectReferencedSpellIds(mainText)) {
        referenced.add(id);
      }
    }

    for (const id of collectReferencedSpellIds(current.customVariablesText)) {
      referenced.add(id);
    }

    const others = yield* Effect.forEach(
      Array.from(referenced).filter((id) => id !== spellId),
      (id) => loadSpellDbcData(id),
      { batching: true, concurrency: "unbounded" },
    );

    const spellDataById = new Map<number, SpellDbcData>([
      [spellId, current],
      ...others.map(toMapEntry),
    ]);

    const env = buildEnv(spellDataById, player);
    const raw = mainText ?? "";
    const rendered = renderWithEnv(env, spellId, raw, 0, []);

    return {
      errors: rendered.errors,
      kind,
      lexErrors: rendered.lexErrors,
      raw,
      spellId,
      text: rendered.text,
    };
  });
}
