import type { CombatLog } from "@wowlab/core/Schemas";
import type { Emitter } from "@wowlab/services/CombatLog";
import type * as Effect from "effect/Effect";

export interface ClassDefinition {
  readonly id: string;
  readonly name: string;
  readonly specs: readonly SpecDefinition[];
}

export interface SpecDefinition {
  readonly class: string;
  readonly handlers: readonly SpellHandler[];
  readonly id: string;
  readonly name: string;
}

export interface SpellHandler<
  E extends CombatLog.CombatLogEvent = CombatLog.SpellCastSuccess,
  R = never,
  Err = never,
> {
  readonly handler: (event: E, emitter: Emitter) => Effect.Effect<void, Err, R>;
  readonly id: string;
  readonly priority?: number;
  readonly requiresTarget?: boolean;
  readonly spellId: number;
  readonly subevent: CombatLog.Subevent;
}
