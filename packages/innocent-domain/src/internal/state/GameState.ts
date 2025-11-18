import * as Branded from "@packages/innocent-schemas/Branded";
import { Map, Record } from "immutable";

import * as Entities from "@/Entities";

let nextStateId = 1;

interface GameStateProps {
  readonly currentTime: number;
  readonly iterationCount: number;
  readonly nextEventTime: number;
  readonly projectiles: Map<Branded.ProjectileID, Entities.Projectile>;
  readonly stateId: number;
  readonly units: Map<Branded.UnitID, Entities.Unit>;
}

const GameStateRecord = Record<GameStateProps>({
  currentTime: 0,
  iterationCount: 0,
  nextEventTime: 0,
  projectiles: Map<Branded.ProjectileID, Entities.Projectile>(),
  stateId: 0,
  units: Map<Branded.UnitID, Entities.Unit>(),
});

const baseSet = GameStateRecord.prototype.set as GameState["set"];

export class GameState extends GameStateRecord {
  override set<K extends keyof GameStateProps>(
    key: K,
    value: GameStateProps[K],
  ): this {
    const updated = baseSet.call(this, key, value) as this;

    if (key === "stateId") {
      return updated;
    }

    return baseSet.call(updated, "stateId", nextStateId++) as this;
  }
}

export function createGameState(): GameState {
  return new GameState();
}
