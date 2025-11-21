import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as Log from "@/Log";
import * as State from "@/State";

import { SpellInfoService } from "../data/service/definition.js";

export class SpellAccessor extends Effect.Service<SpellAccessor>()(
  "SpellAccessor",
  {
    dependencies: [State.StateService.Default, Log.LogService.Default],
    effect: Effect.gen(function* () {
      const stateService = yield* State.StateService;
      const logService = yield* Log.LogService;

      return {
        all: (unitId: Branded.UnitID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }
            return unit.spells.all.toArray().map(([_, spell]) => spell);
          }),

        get: (unitId: Branded.UnitID, spellId: Branded.SpellID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }
            const spell = unit.spells.all.get(spellId);
            if (!spell) {
              return yield* Effect.fail(new Errors.SpellNotFound({ spellId }));
            }
            return spell;
          }),

        getCooldownCategory: (unitId: Branded.UnitID, categoryId: number) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }
            return unit.spells.meta.cooldownCategories.get(categoryId) ?? 0;
          }),

        getOrNull: (unitId: Branded.UnitID, spellId: Branded.SpellID) =>
          Effect.gen(function* () {
            yield* logService.info(
              "SpellAccessor",
              `Getting spell ${spellId} for unit ${unitId}`,
              { spellId, unitId },
            );
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              yield* logService.warn(
                "SpellAccessor",
                `Unit ${unitId} NOT FOUND - returning stub spell`,
                {
                  unitId,
                },
              );
              // Try to get spell info and return stub spell
              const spellInfoService = yield* SpellInfoService;
              return yield* spellInfoService
                .getSpell(spellId, { profileIds: [] })
                .pipe(
                  Effect.map((info) =>
                    Entities.Spell.create(
                      {
                        charges: 0,
                        cooldownExpiry: Infinity, // Never ready
                        info,
                      },
                      0,
                    ),
                  ),
                  Effect.catchAll(() =>
                    Effect.succeed(Entities.createNotFoundSpell(spellId)),
                  ),
                );
            }
            yield* logService.info(
              "SpellAccessor",
              `Unit ${unitId} has ${unit.spells.all.size} learned spells`,
              { learnedSpellCount: unit.spells.all.size, unitId },
            );
            const spell = unit.spells.all.get(spellId);
            if (spell) {
              yield* logService.info(
                "SpellAccessor",
                `Spell ${spellId} found in unit's learned spells`,
                { spellId, unitId },
              );
              return spell;
            }

            // Not learned - fetch SpellInfo and return stub with real info
            yield* logService.info(
              "SpellAccessor",
              `Spell ${spellId} NOT learned, yielding SpellInfoService...`,
              { spellId, unitId },
            );
            const spellInfoService = yield* SpellInfoService;
            yield* logService.info(
              "SpellAccessor",
              `Got SpellInfoService, fetching spell ${spellId}`,
              { spellId },
            );
            const spellInfo = yield* spellInfoService.getSpell(spellId, {
              profileIds: unit.profiles,
            });
            yield* logService.info(
              "SpellAccessor",
              `Got SpellInfo: ${spellInfo.name}`,
              {
                spellId,
                spellName: spellInfo.name,
              },
            );
            return Entities.Spell.create(
              {
                charges: 0,
                cooldownExpiry: Infinity, // Never ready (not learned)
                info: spellInfo,
              },
              0,
            );
          }),

        has: (unitId: Branded.UnitID, spellId: Branded.SpellID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return false;
            }
            return unit.spells.all.has(spellId);
          }),

        updateSpell: (unitId: Branded.UnitID, spell: Entities.Spell) =>
          stateService.updateState((s) => {
            const unit = s.units.get(unitId);
            if (!unit) {
              return s;
            }
            return s.setIn(
              ["units", unitId, "spells", "all", spell.info.id],
              spell,
            );
          }),
      };
    }),
  },
) {}
