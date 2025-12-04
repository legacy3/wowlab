import type { CombatLog } from "@wowlab/core/Schemas";
import type { Emitter } from "@wowlab/services/CombatLog";

import * as Effect from "effect/Effect";

import type { SpellHandler } from "./types.js";

interface Opts {
  readonly requiresTarget?: boolean;
}

export const handler = (
  id: string,
  spellId: number,
  fn: (event: CombatLog.SpellCastSuccess, emit: Emitter["emit"]) => void,
  opts?: Opts,
): SpellHandler => ({
  handler: (event, emitter) =>
    Effect.sync(() => fn(event, emitter.emit.bind(emitter))),
  id,
  requiresTarget: opts?.requiresTarget,
  spellId,
  subevent: "SPELL_CAST_SUCCESS",
});
