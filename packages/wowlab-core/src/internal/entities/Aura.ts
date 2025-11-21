import { Record } from "immutable";

import * as Branded from "../schemas/Branded.js";
import { createNotFoundSpellInfo, SpellInfo } from "./Spell.js";
import { boundedTransform, expiryTransform } from "./Transforms.js";

interface AuraComputedProps {
  readonly isActive: boolean;
}

interface AuraProps extends AuraComputedProps, AuraSourceProps {}

interface AuraSourceProps {
  readonly casterUnitId: Branded.UnitID;
  readonly expiresAt: number;
  readonly info: SpellInfo;
  readonly stacks: number;
}

const AuraRecord = Record<AuraProps>({
  casterUnitId: Branded.UnitID("unknown"),
  expiresAt: 0,
  info: null as any,
  isActive: false,
  stacks: 0,
});

export interface ComputedEntity<T, Source> {
  transform: any;
  with(updates: Partial<Source>, currentTime: number): T;
}

export class Aura
  extends AuraRecord
  implements ComputedEntity<Aura, AuraSourceProps>
{
  static create(source: AuraSourceProps, currentTime: number): Aura {
    return new Aura({
      ...source,
      isActive: source.expiresAt > currentTime,
    });
  }

  get transform() {
    return {
      duration: expiryTransform(this.expiresAt, (newExpiry, currentTime) =>
        this.with({ expiresAt: newExpiry }, currentTime),
      ),

      stacks: boundedTransform(
        this.stacks,
        0,
        this.info.durationMax,
        (newStacks, currentTime) =>
          this.with({ stacks: newStacks }, currentTime),
      ),
    };
  }

  with(updates: Partial<AuraSourceProps>, currentTime: number): Aura {
    return Aura.create(
      {
        casterUnitId: updates.casterUnitId ?? this.casterUnitId,
        expiresAt: updates.expiresAt ?? this.expiresAt,
        info: updates.info ?? this.info,
        stacks: updates.stacks ?? this.stacks,
      },
      currentTime,
    );
  }
}

export const createNotFoundAura = (
  id: Branded.SpellID,
  currentTime: number = 0,
): Aura => {
  const info = createNotFoundSpellInfo(id);
  return Aura.create(
    {
      casterUnitId: Branded.UnitID("unknown"),
      expiresAt: currentTime,
      info,
      stacks: 0,
    },
    currentTime,
  );
};
