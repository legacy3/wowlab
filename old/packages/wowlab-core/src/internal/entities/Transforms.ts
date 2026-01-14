// Bounded Transform
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export type Bounded<T> = {
  increment(params: IncrementParams): T;
  decrement(params: IncrementParams): T;
  modify(params: ModifyParams): T;
  set(params: ModifyParams): T;
};
// Expiry Transform
export type Expiry<T> = {
  trigger(params: TriggerParams): T;
  reset(params: ResetParams): T;
  reduce(params: ReduceParams): T;
  refresh(params: TriggerParams): T;
  modify(params: ModifyParams): T;
  set(params: SetParams): T;
};
type IncrementParams = { amount: number; time: number };

type ModifyParams = { value: number; time: number };

type ReduceParams = { amount: number; time: number };
type ResetParams = { time: number };
type SetParams = { value: number; time: number };
type TriggerParams = { duration: number; time: number };
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
      return update(newValue, params.time);
    },
    increment: (params: IncrementParams) => {
      const amount = params.amount ?? 1;
      const newValue = clamp(current + amount, min, max);
      return update(newValue, params.time);
    },
    modify: (params: ModifyParams) => {
      const newValue = clamp(current + params.value, min, max);
      return update(newValue, params.time);
    },
    set: (params: ModifyParams) => {
      const newValue = clamp(params.value, min, max);
      return update(newValue, params.time);
    },
  };
}

export function expiryTransform<T>(
  current: number,
  update: (newValue: number, currentTime: number) => T,
): Expiry<T> {
  return {
    modify: (params: ModifyParams) => {
      return update(current + params.value, params.time);
    },
    reduce: (params: ReduceParams) => {
      return update(
        Math.max(params.time, current - params.amount),
        params.time,
      );
    },
    refresh: (params: TriggerParams) => {
      return update(params.time + params.duration, params.time);
    },
    reset: (params: ResetParams) => {
      return update(params.time, params.time);
    },
    set: (params: SetParams) => {
      return update(params.value, params.time);
    },
    trigger: (params: TriggerParams) => {
      return update(params.time + params.duration, params.time);
    },
  };
}
