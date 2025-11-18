const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export type Bounded<T> = {
  increment(params: IncrementParams): T;
  decrement(params: IncrementParams): T;
  modify(params: ModifyParams): T;
  set(params: ModifyParams): T;
};
type IncrementParams = { amount: number; time: number };

type ModifyParams = { value: number; time: number };

export function boundedTransform<T>(
  current: number,
  min: number,
  max: number,
  update: (newValue: number, currentTime: number) => T,
): Bounded<T> {
  return {
    decrement: (params: IncrementParams) => {
      const amount = params.amount ?? 1;
      const newValue = clamp(current - amount, min, max);

      return update(newValue, newValue);
    },
    increment: (params: IncrementParams) => {
      const amount = params.amount ?? 1;
      const newValue = clamp(current + amount, min, max);

      return update(newValue, newValue);
    },
    modify: (params: ModifyParams) => {
      const newValue = clamp(current + params.value, min, max);

      return update(newValue, newValue);
    },
    set: (params: ModifyParams) => {
      const newValue = clamp(params.value, min, max);

      return update(newValue, newValue);
    },
  };
}
