import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import { Map } from "immutable";
import * as Entities from "@packages/innocent-domain/Entities";
import * as DomainProfile from "@packages/innocent-domain/Profile";

import * as Metadata from "@/Metadata";
import * as Modifiers from "@/Modifiers";
import * as Profile from "@/Profile";

import { SpellInfoService } from "./definition.js";

export * from "./definition.js";

const make = Effect.gen(function* () {
  // Dependencies
  const metadata = yield* Metadata.MetadataService;
  const profileComposer = yield* Profile.ProfileComposer;
  const modifierRuntime = yield* Modifiers.createModifierRuntime;

  // State
  const spellInfoCacheRef =
    yield* Ref.make<Map<string, Entities.SpellInfo>>(
      Map<string, Entities.SpellInfo>(),
    );

  // Constants
  const baseModifiers = [
    Modifiers.ConsumeSpellResource,
    Modifiers.TriggerSpellCooldown,
    Modifiers.ClearCastingState,
    Modifiers.LaunchSpellProjectile,
  ] as const;

  return {
    getSpell: (spellId: number, options?: SpellRequestOptions) =>
      Effect.gen(function* () {
        // Normalize profile IDs
        const profileIds = options?.profileIds ?? [];
        const normalizedProfileIds =
          DomainProfile.Signature.normalizeProfileIds(profileIds);
        const signature =
          DomainProfile.Signature.profileSignature(normalizedProfileIds);
        const cacheKey = `${spellId}|${signature}`;

        // Check cache
        const spellInfoCache = yield* Ref.get(spellInfoCacheRef);
        const cachedSpellInfo = spellInfoCache.get(cacheKey);
        if (cachedSpellInfo) {
          return cachedSpellInfo;
        }

        // Load flat data from metadata service
        const flatData = yield* metadata.loadSpell(spellId);

        // Compose profile
        const profile = yield* profileComposer.compose(normalizedProfileIds);

        // Build SpellInfo with all business logic
        const spellInfo = Entities.Factories.SpellFactory.build({
          baseModifiers,
          data: flatData,
          modifierRuntime,
          profile,
        });

        // Cache
        yield* Ref.update(spellInfoCacheRef, (cache) =>
          cache.set(cacheKey, spellInfo),
        );

        return spellInfo;
      }),
  };
});

export const SpellInfoServiceLive = Layer.effect(SpellInfoService, make);
