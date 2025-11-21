import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface UnitService {
  readonly addUnit: (unit: Entities.Unit.Unit) => Effect.Effect<void>;
  readonly getUnit: (
    id: Schemas.Branded.UnitID,
  ) => Effect.Effect<Entities.Unit.Unit | null>;
  readonly removeUnit: (id: Schemas.Branded.UnitID) => Effect.Effect<void>;
  readonly updateUnit: (
    id: Schemas.Branded.UnitID,
    f: (unit: Entities.Unit.Unit) => Entities.Unit.Unit,
  ) => Effect.Effect<void>;
}

export const UnitService = Context.GenericTag<UnitService>(
  "@wowlab/services/UnitService",
);
