import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { SpellAccessor } from "../accessors/SpellAccessor.js";
import { UnitAccessor } from "../accessors/UnitAccessor.js";
import { LogService } from "../log/LogService.js";

export class SpellService extends Effect.Service<SpellService>()("SpellService", {
  dependencies: [
    SpellAccessor.Default,
    UnitAccessor.Default,
    LogService.Default,
  ],
  effect: Effect.gen(function* () {
    const spellAccessor = yield* SpellAccessor;
    const unitAccessor = yield* UnitAccessor;
    const log = yield* LogService;

    return {
      cast: (
        spellId: Schemas.Branded.SpellID,
        casterId: Schemas.Branded.UnitID,
        targetId: Schemas.Branded.UnitID | null,
      ) =>
        Effect.gen(function* () {
          // Verify caster exists
          const caster = yield* unitAccessor.get(casterId);

          // Verify spell exists on caster
          const spell = yield* spellAccessor.get(casterId, spellId as number);

          yield* log.info(
            `Casting spell ${spell.info.name} from ${caster.name} to ${targetId || "none"}`,
          );

          // TODO: Implement actual cast logic
        }),
    };
  }),
}) {}
