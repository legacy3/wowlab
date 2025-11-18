import * as Errors from "@packages/innocent-domain/Errors";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Config from "@packages/innocent-spellbook/Config";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Ref from "effect/Ref";
import { Map as ImmutableMap } from "immutable";

const mergeUnique = <A>(
  groups: ReadonlyArray<ReadonlyArray<A>>,
): readonly A[] => {
  const seen = new Set<A>();
  const merged: A[] = [];

  for (const group of groups) {
    for (const value of group) {
      if (seen.has(value)) {
        continue;
      }
      seen.add(value);
      merged.push(value);
    }
  }

  return Object.freeze(merged);
};

const composeBundles = (
  bundles: ReadonlyArray<Profile.Types.ProfileBundle>,
  signature: string,
): Profile.Types.ComposedProfile => {
  const modifiers = mergeUnique(bundles.map((bundle) => bundle.modifiers));
  const auras = mergeUnique(bundles.map((bundle) => bundle.auras));
  const talents = mergeUnique(bundles.map((bundle) => bundle.talents));

  let overrides: Profile.SpellOverrideMap = ImmutableMap<
    number,
    Profile.SpellOverrideClass
  >();
  for (const bundle of bundles) {
    overrides = overrides.merge(bundle.spellOverrides);
  }

  return {
    auras,
    bundleIds: bundles.map((bundle) => bundle.id),
    modifiers,
    signature,
    spellOverrides: overrides,
    talents,
  };
};

export class ProfileComposer extends Effect.Service<ProfileComposer>()(
  "ProfileComposer",
  {
    effect: Effect.gen(function* () {
      const cacheRef = yield* Ref.make(
        new Map<string, Profile.Types.ComposedProfile>(),
      );

      const compose = (
        profileIds: ReadonlyArray<string>,
      ): Effect.Effect<
        Profile.Types.ComposedProfile,
        Errors.ProfileBundleNotFound
      > =>
        pipe(
          Effect.gen(function* () {
            const normalized =
              Profile.Signature.normalizeProfileIds(profileIds);
            const signature = Profile.Signature.profileSignature(normalized);

            const cache = yield* Ref.get(cacheRef);
            const cached = cache.get(signature);
            if (cached) {
              return cached;
            }

            const bundles: Profile.ProfileBundle[] = [];

            for (const id of normalized) {
              const bundle = Config.PROFILE_BUNDLE_REGISTRY.get(id);
              if (!bundle) {
                return yield* Effect.fail(
                  new Errors.ProfileBundleNotFound({ id }),
                );
              }

              bundles.push(bundle);
            }

            const composed = composeBundles(bundles, signature);

            yield* Ref.update(cacheRef, (previous) => {
              const next = new Map(previous);
              next.set(signature, composed);

              return next;
            });

            return composed;
          }),
        );

      return {
        compose,
        inspectBundles: () => Config.PROFILE_BUNDLE_LIST,
      };
    }),
  },
) {}
