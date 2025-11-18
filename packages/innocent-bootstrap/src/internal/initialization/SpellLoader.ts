import type * as Errors from "@packages/innocent-domain/Errors";

import * as Data from "@packages/innocent-services/Data";
import * as Effect from "effect/Effect";

export const preloadSpellInfoCache = (): Effect.Effect<
  void,
  Errors.Data | Errors.SpellInfoNotFound | Errors.ProfileBundleNotFound,
  Data.SpellInfoService
> =>
  Effect.gen(function* () {
    const spellInfoService = yield* Data.SpellInfoService;

    // Pre-cache common spell IDs to warm up the cache
    // Units will learn spells as needed, referencing these cached SpellInfos
    const commonSpellIds = [133, 11366, 108853]; // Fireball, Pyroblast, FireBlast

    yield* Effect.all(
      commonSpellIds.map((id) =>
        Effect.gen(function* () {
          yield* spellInfoService.getSpell(id, { profileIds: [] });
        }),
      ),
      { concurrency: "unbounded" },
    );
  });
