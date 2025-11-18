export type Expiry<T> = {
  trigger(params: TriggerParams): T;
  reset(params: ResetParams): T;
  reduce(params: ReduceParams): T;
  refresh(params: TriggerParams): T;
  modify(params: ModifyParams): T;
  set(params: SetParams): T;
};
type ModifyParams = { value: number; time: number };
type ReduceParams = { amount: number; time: number };
type ResetParams = { time: number };
type SetParams = { value: number; time: number };
type TriggerParams = { duration: number; time: number };

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
