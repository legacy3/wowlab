import { Record } from "immutable";

interface PositionProps {
  readonly x: number;
  readonly y: number;
  readonly facing: number;
}

const PositionRecord = Record<PositionProps>({
  x: 0,
  y: 0,
  facing: 0,
});

export class Position extends PositionRecord {
  static create(props: Partial<PositionProps>): Position {
    return new Position(props);
  }
}
