import { Entities, Schemas } from "@wowlab/core";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import { StateService } from "../state/StateService.js";

export class SpellLifecycleService extends Effect.Service<SpellLifecycleService>()(
  "SpellLifecycleService",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      const getModifiers = (
        spell: Entities.Spell.Spell,
        casterId: Schemas.Branded.UnitID,
      ) =>
        Effect.gen(function* () {
          const spellModifiers = spell.info.modifiers;

          const caster = yield* state.getUnit(casterId);
          const auraModifiers = caster.auras.all
            .valueSeq()
            .flatMap((aura) => aura.info.modifiers)
            .toArray();

          return [...spellModifiers, ...auraModifiers];
        });

      return {
        executeBeforeCast: (
          spell: Entities.Spell.Spell,
          casterId: Schemas.Branded.UnitID,
        ) =>
          Effect.gen(function* () {
            const modifiers = yield* getModifiers(spell, casterId);
            if (modifiers.length === 0) {
              return spell;
            }

            return yield* pipe(
              Effect.reduce(
                modifiers,
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
          }),

        executeOnCast: (
          spell: Entities.Spell.Spell,
          casterId: Schemas.Branded.UnitID,
        ) =>
          Effect.gen(function* () {
            const modifiers = yield* getModifiers(spell, casterId);
            if (modifiers.length === 0) {
              return;
            }

            return yield* pipe(
              Effect.all(
                modifiers.map((modifier) =>
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
          }),

        executeOnDamage: (
          spell: Entities.Spell.Spell,
          damage: number,
          casterId: Schemas.Branded.UnitID,
        ) =>
          Effect.gen(function* () {
            const modifiers = yield* getModifiers(spell, casterId);
            if (modifiers.length === 0) {
              return;
            }

            return yield* pipe(
              Effect.all(
                modifiers.map((modifier) =>
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
          }),

        executeOnHit: (
          spell: Entities.Spell.Spell,
          target: Entities.Unit.Unit | undefined,
          casterId: Schemas.Branded.UnitID,
        ) =>
          Effect.gen(function* () {
            const modifiers = yield* getModifiers(spell, casterId);
            if (modifiers.length === 0) {
              return;
            }

            return yield* pipe(
              Effect.all(
                modifiers.map((modifier) =>
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
      };
    }),
  },
) {}
