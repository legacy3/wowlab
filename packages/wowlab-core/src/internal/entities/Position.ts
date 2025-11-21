import { Record } from "immutable";

interface PositionProps {
  readonly facing: number;
  readonly x: number;
  readonly y: number;
}

const PositionRecord = Record<PositionProps>({
  facing: 0,
  x: 0,
  y: 0,
});

export class Position extends PositionRecord {
  static create(props: Partial<PositionProps>): Position {
    return new Position(props);
  }
}
