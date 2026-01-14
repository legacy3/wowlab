import type {
  CastEvent,
  DamageEvent,
  BuffEvent,
  ResourceEvent,
  PhaseMarker,
} from "@/atoms/timeline";
import { CastTracker } from "./state/cast-tracker";
import { AuraTracker } from "./state/aura-tracker";

export interface IdGenerator {
  next(prefix: string): string;
}

export interface TransformState {
  readonly casts: CastTracker;
  readonly auras: AuraTracker;
}

export interface TransformEmitters {
  cast(event: CastEvent): void;
  damage(event: DamageEvent): void;
  buff(event: BuffEvent): void;
  resource(event: ResourceEvent): void;
}

export interface TransformContext {
  readonly state: TransformState;
  readonly emit: TransformEmitters;
  readonly ids: IdGenerator;
  readonly durationSec: number;
}

export interface TransformResult {
  readonly casts: CastEvent[];
  readonly damage: DamageEvent[];
  readonly buffs: BuffEvent[];
  readonly resources: ResourceEvent[];
  readonly phases: PhaseMarker[];
}

export function createContext(durationMs: number): TransformContext & {
  flush(): TransformResult;
} {
  const durationSec = durationMs / 1000;

  const casts: CastEvent[] = [];
  const damage: DamageEvent[] = [];
  const buffs: BuffEvent[] = [];
  const resources: ResourceEvent[] = [];

  const castTracker = new CastTracker();
  const auraTracker = new AuraTracker();

  const counters = new Map<string, number>();
  const ids: IdGenerator = {
    next(prefix: string): string {
      const current = counters.get(prefix) ?? 0;
      counters.set(prefix, current + 1);
      return `${prefix}-${current}`;
    },
  };

  const emit: TransformEmitters = {
    cast: (event) => casts.push(event),
    damage: (event) => damage.push(event),
    buff: (event) => buffs.push(event),
    resource: (event) => resources.push(event),
  };

  const ctx: TransformContext = {
    state: {
      casts: castTracker,
      auras: auraTracker,
    },
    emit,
    ids,
    durationSec,
  };

  return {
    ...ctx,
    flush(): TransformResult {
      auraTracker.flushOpen(durationSec, ids, emit.buff);

      const phases: PhaseMarker[] = [
        {
          type: "phase",
          id: "phase-0",
          name: "Combat",
          start: 0,
          end: durationSec,
          color: "#3B82F6",
        },
      ];

      return {
        casts,
        damage,
        buffs,
        resources,
        phases,
      };
    },
  };
}
