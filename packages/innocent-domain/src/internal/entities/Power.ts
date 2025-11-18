import { Record } from "immutable";

import type { ComputedEntity } from "./shared";

import { boundedTransform } from "./shared/transforms";

interface PowerComputedProps {
  readonly deficit: number;
  readonly percent: number;
}

interface PowerProps extends PowerComputedProps, PowerSourceProps {}

interface PowerSourceProps {
  readonly current: number;
  readonly max: number;
}

const PowerRecord = Record<PowerProps>({
  current: 0,
  deficit: 0,
  max: 0,
  percent: 0,
});

export class Power
  extends PowerRecord
  implements ComputedEntity<Power, PowerSourceProps>
{
  static create(source: PowerSourceProps): Power {
    const percent = source.max === 0 ? 0 : (source.current / source.max) * 100;
    const deficit = source.max - source.current;

    return new Power({
      ...source,
      deficit,
      percent,
    });
  }

  get transform() {
    return {
      value: boundedTransform(
        this.current,
        0,
        this.max,
        (newCurrent, currentTime) =>
          this.with({ current: newCurrent }, currentTime),
      ),
    };
  }

  with(updates: Partial<PowerSourceProps>, _currentTime: number): Power {
    return Power.create({
      current: updates.current ?? this.current,
      max: updates.max ?? this.max,
    });
  }
}
