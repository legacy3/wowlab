import * as Entities from "@packages/innocent-domain/Entities";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

export class SpellLifecycleService extends Effect.Service<SpellLifecycleService>()(
  "SpellLifecycleService",
  {
    sync: () => ({
      executeBeforeCast: Effect.fn("SpellLifecycleService.executeBeforeCast")(
        function* (spell: Entities.Spell) {
          if (spell.info.modifiers.length === 0) {
            return spell;
          }

          return yield* pipe(
            Effect.reduce(
              spell.info.modifiers,
              spell,
              (currentSpell, modifier) =>
                pipe(
                  modifier.beforeCast?.(currentSpell) ??
                    Effect.succeed(currentSpell),
                  Effect.withSpan(
                    `spell:${spell.info.name}:modifier:${modifier.name}:beforeCast`,
                  ),
                  Effect.annotateLogs("modifier", modifier.name),
                ),
            ),
            Effect.annotateLogs({
              phase: "beforeCast",
              spellId: spell.info.id,
              spellName: spell.info.name,
            }),
          );
        },
      ),

      executeOnCast: Effect.fn("SpellLifecycleService.executeOnCast")(
        function* (spell: Entities.Spell) {
          if (spell.info.modifiers.length === 0) {
            return;
          }

          return yield* pipe(
            Effect.all(
              spell.info.modifiers.map((modifier) =>
                pipe(
                  modifier.onCast?.(spell) ?? Effect.void,
                  Effect.withSpan(
                    `spell:${spell.info.name}:modifier:${modifier.name}`,
                  ),
                  Effect.annotateLogs("modifier", modifier.name),
                ),
              ),
              { concurrency: "unbounded" },
            ),
            Effect.asVoid,
            Effect.annotateLogs({
              phase: "onCast",
              spellId: spell.info.id,
              spellName: spell.info.name,
            }),
          );
        },
      ),

      executeOnDamage: Effect.fn("SpellLifecycleService.executeOnDamage")(
        function* (spell: Entities.Spell, damage: number) {
          if (spell.info.modifiers.length === 0) {
            return;
          }

          return yield* pipe(
            Effect.all(
              spell.info.modifiers.map((modifier) =>
                pipe(
                  modifier.onDamage?.(spell, damage) ?? Effect.void,
                  Effect.withSpan(
                    `spell:${spell.info.name}:modifier:${modifier.name}:onDamage`,
                  ),
                  Effect.annotateLogs("modifier", modifier.name),
                ),
              ),
              { concurrency: "unbounded" },
            ),
            Effect.asVoid,
            Effect.annotateLogs({
              damage,
              phase: "onDamage",
              spellId: spell.info.id,
              spellName: spell.info.name,
            }),
          );
        },
      ),

      executeOnHit: Effect.fn("SpellLifecycleService.executeOnHit")(function* (
        spell: Entities.Spell,
        target?: Entities.Unit,
      ) {
        if (spell.info.modifiers.length === 0) {
          return;
        }

        return yield* pipe(
          Effect.all(
            spell.info.modifiers.map((modifier) =>
              pipe(
                modifier.onHit?.(spell, target) ?? Effect.void,
                Effect.withSpan(
                  `spell:${spell.info.name}:modifier:${modifier.name}:onHit`,
                ),
                Effect.annotateLogs("modifier", modifier.name),
              ),
            ),
            { concurrency: "unbounded" },
          ),
          Effect.asVoid,
          Effect.annotateLogs({
            phase: "onHit",
            spellId: spell.info.id,
            spellName: spell.info.name,
            targetId: target?.id,
          }),
        );
      }),
    }),
  },
) {}
