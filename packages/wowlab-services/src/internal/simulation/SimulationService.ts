import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface SimulationService {
  readonly run: (durationMs: number) => Effect.Effect<void>;
  readonly step: () => Effect.Effect<boolean>; // Returns true if simulation should continue
}

export const SimulationService = Context.GenericTag<SimulationService>(
  "@wowlab/services/SimulationService",
);
