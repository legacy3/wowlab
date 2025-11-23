import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schedule from "effect/Schedule";

import type { Spell } from "../Spell.js";
import type { Unit } from "../Unit.js";

import * as Errors from "../../errors/index.js";

export type SpellModifier = {
  readonly name: string;
  readonly beforeCast?: (
    spell: Spell,
  ) => Effect.Effect<Spell, Errors.Modifier, never>;
  readonly onCast?: (
    spell: Spell,
  ) => Effect.Effect<void, Errors.Modifier, never>;
  readonly onHit?: (
    spell: Spell,
    target?: Unit,
  ) => Effect.Effect<void, Errors.Modifier, never>;
  readonly onDamage?: (
    spell: Spell,
    damage: number,
  ) => Effect.Effect<void, Errors.Modifier, never>;
};

export const composeModifiers = (
  ...modifiers: SpellModifier[]
): SpellModifier => ({
  name: modifiers.map((m) => m.name).join("+"),

  onCast: (spell) =>
    pipe(
      Effect.all(
        modifiers.map((m) =>
          pipe(
            m.onCast?.(spell) ?? Effect.void,
            Effect.timeout("5 seconds"),
            Effect.retry({
              schedule: Schedule.exponential("10 millis"),
              times: 2,
            }),
            Effect.withSpan(`modifier:${m.name}`),
            Effect.annotateLogs("modifier", m.name),
            Effect.tap(() => Effect.logDebug(`[${m.name}] executed`)),
            Effect.mapError(
              (error) =>
                new Errors.Modifier({
                  modifierName: m.name,
                  phase: "onCast",
                  reason: String(error),
                  spell,
                }),
            ),
          ),
        ),
        { concurrency: "unbounded" },
      ),
      Effect.asVoid,
    ),

  onHit: (spell, target) =>
    pipe(
      Effect.all(
        modifiers.map((m) =>
          pipe(
            m.onHit?.(spell, target) ?? Effect.void,
            Effect.timeout("5 seconds"),
            Effect.withSpan(`modifier:${m.name}:onHit`),
            Effect.annotateLogs("modifier", m.name),
            Effect.mapError(
              (error) =>
                new Errors.Modifier({
                  modifierName: m.name,
                  phase: "onHit",
                  reason: String(error),
                  spell,
                }),
            ),
          ),
        ),
        { concurrency: "unbounded" },
      ),
      Effect.asVoid,
    ),
});
