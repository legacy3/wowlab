import * as Branded from "@packages/innocent-schemas/Branded";
import { Record } from "immutable";

import type { ComputedEntity } from "./shared";

import { boundedTransform, expiryTransform } from "./shared/transforms";
import { createNotFoundSpellInfo, SpellInfo } from "./SpellInfo";

interface SpellComputedProps {
  readonly isReady: boolean;
}

interface SpellProps extends SpellComputedProps, SpellSourceProps {}

interface SpellSourceProps {
  readonly charges: number;
  readonly cooldownExpiry: number;
  readonly info: SpellInfo;
}

const SpellRecord = Record<SpellProps>({
  charges: 0,
  cooldownExpiry: 0,
  info: null as any, // createNotFoundSpellInfo(Branded.SpellID(-1)),
  isReady: false,
});

export class Spell
  extends SpellRecord
  implements ComputedEntity<Spell, SpellSourceProps>
{
  static create(source: SpellSourceProps, currentTime: number): Spell {
    return new Spell({
      ...source,
      isReady: source.cooldownExpiry <= currentTime,
    });
  }

  get transform() {
    return {
      charges: boundedTransform(
        this.charges,
        0,
        this.info.maxCharges,
        (newCharges, currentTime) =>
          this.with({ charges: newCharges }, currentTime),
      ),

      cooldown: expiryTransform(this.cooldownExpiry, (newExpiry, currentTime) =>
        this.with({ cooldownExpiry: newExpiry }, currentTime),
      ),
    };
  }

  with(updates: Partial<SpellSourceProps>, currentTime: number): Spell {
    return Spell.create(
      {
        charges: updates.charges ?? this.charges,
        cooldownExpiry: updates.cooldownExpiry ?? this.cooldownExpiry,
        info: updates.info ?? this.info,
      },
      currentTime,
    );
  }
}

export const createNotFoundSpell = (id: Branded.SpellID): Spell => {
  const info = createNotFoundSpellInfo(id);
  return Spell.create(
    {
      charges: 0,
      cooldownExpiry: Infinity, // Never ready (not learned)
      info,
    },
    0,
  );
};
