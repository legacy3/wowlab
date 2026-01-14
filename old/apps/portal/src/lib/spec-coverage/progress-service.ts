import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as PubSub from "effect/PubSub";
import {
  SpecCoverageProgressService,
  type SpecCoverageProgress,
} from "@wowlab/services/Data";

export type { SpecCoverageProgress };

export const SpecCoverageProgressLive = Layer.effect(
  SpecCoverageProgressService,
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<SpecCoverageProgress>();

    return {
      publish: (progress: SpecCoverageProgress) =>
        PubSub.publish(pubsub, progress),
      pubsub,
    };
  }),
);
