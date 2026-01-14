import type * as PubSub from "effect/PubSub";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface SpecCoverageProgress {
  className: string;
  loaded: number;
  specName: string;
  total: number;
}

export interface SpecCoverageProgressService {
  readonly publish: (progress: SpecCoverageProgress) => Effect.Effect<boolean>;
  readonly pubsub: PubSub.PubSub<SpecCoverageProgress>;
}

export const SpecCoverageProgressService =
  Context.GenericTag<SpecCoverageProgressService>(
    "@wowlab/services/SpecCoverageProgressService",
  );
