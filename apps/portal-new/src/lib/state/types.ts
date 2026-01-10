export interface StateResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;

  refresh?: () => Promise<void>;
  set: (value: T | ((prev: T | null) => T | null)) => void;
}
