import * as Entities from "@packages/innocent-domain/Entities";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Accessors from "@packages/innocent-services/Accessors";
import * as CastQueue from "@packages/innocent-services/CastQueue";
import * as Log from "@packages/innocent-services/Log";
import * as Effect from "effect/Effect";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [
      CastQueue.CastQueueService.Default,
      Accessors.SpellAccessor.Default,
      Accessors.UnitAccessor.Default,
      Log.LogService.Default,
    ],
    effect: Effect.gen(function* () {
      const castQueue = yield* CastQueue.CastQueueService;
      const spellAccessor = yield* Accessors.SpellAccessor;
      const unitAccessor = yield* Accessors.UnitAccessor;
      const logService = yield* Log.LogService;

      return {
        all: () =>
          Effect.gen(function* () {
            const player = yield* unitAccessor.player();
            return yield* spellAccessor.all(player.id);
          }),

        cast: (spell: Entities.Spell, targetId?: string) =>
          Effect.gen(function* () {
            yield* logService.info(
              "SpellActions",
              `cast() called for ${spell.info.name}`,
              { spellId: spell.info.id, spellName: spell.info.name, targetId },
            );
            yield* logService.info(
              "SpellActions",
              `About to enqueue ${spell.info.name}`,
              { spellId: spell.info.id, spellName: spell.info.name },
            );
            yield* castQueue.enqueue(
              spell,
              targetId ? Branded.UnitID(targetId) : undefined,
            );
            yield* logService.info(
              "SpellActions",
              `enqueue completed for ${spell.info.name}`,
              { spellId: spell.info.id, spellName: spell.info.name },
            );
          }),

        get: (id: number) =>
          Effect.gen(function* () {
            const spellId = Branded.SpellID(id);
            yield* logService.debug("SpellActions", `Getting spell ${id}`, {
              spellId: id,
            });
            const player = yield* unitAccessor.player();
            yield* logService.debug(
              "SpellActions",
              `About to call getOrNull for spell ${id}`,
              { playerId: player.id, spellId: id },
            );
            const result = yield* spellAccessor.getOrNull(player.id, spellId);
            yield* logService.debug(
              "SpellActions",
              `Got spell ${id}: ${result.info.name}`,
              { spellId: id, spellName: result.info.name },
            );
            return result;
          }),
      };
    }),
  },
) {}
