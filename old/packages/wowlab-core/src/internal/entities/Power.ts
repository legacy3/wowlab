import { Record } from "immutable";

interface PowerProps {
  readonly current: number;
  readonly max: number;
}

const PowerRecord = Record<PowerProps>({
  current: 0,
  max: 0,
});

export class Power extends PowerRecord {
  static create(props: Partial<PowerProps>): Power {
    return new Power(props);
  }
}
