import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schedule from "effect/Schedule";

import * as Entities from "@/Entities";
import * as Errors from "@/Errors";

export type SpellModifier = {
  readonly name: string;
  readonly beforeCast?: (
    spell: Entities.Spell,
  ) => Effect.Effect<Entities.Spell, Errors.Modifier, unknown>;
  readonly onCast?: (
    spell: Entities.Spell,
  ) => Effect.Effect<void, Errors.Modifier, unknown>;
  readonly onHit?: (
    spell: Entities.Spell,
    target?: Entities.Unit,
  ) => Effect.Effect<void, Errors.Modifier, unknown>;
  readonly onDamage?: (
    spell: Entities.Spell,
    damage: number,
  ) => Effect.Effect<void, Errors.Modifier, unknown>;
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
