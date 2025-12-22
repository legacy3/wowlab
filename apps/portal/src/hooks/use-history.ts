import { useCallback, useRef, useState } from "react";

interface UseHistoryOptions<T> {
  maxHistory?: number;
  isEqual?: (a: T, b: T) => boolean;
}

interface UseHistoryReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

function defaultIsEqual<T>(a: T, b: T): boolean {
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || b.get(key) !== value) return false;
    }

    return true;
  }

  return a === b;
}

export function useHistory<T>(
  initialValue: T,
  options: UseHistoryOptions<T> = {},
): UseHistoryReturn<T> {
  const { maxHistory = 50, isEqual = defaultIsEqual } = options;

  const [value, setValueInternal] = useState<T>(initialValue);
  const historyRef = useRef<T[]>([initialValue]);
  const indexRef = useRef(0);

  const setValue = useCallback(
    (nextValueOrFn: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const nextValue =
          typeof nextValueOrFn === "function"
            ? (nextValueOrFn as (prev: T) => T)(prev)
            : nextValueOrFn;

        if (isEqual(prev, nextValue)) {
          return prev;
        }

        historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
        historyRef.current.push(nextValue);

        if (historyRef.current.length > maxHistory) {
          historyRef.current = historyRef.current.slice(-maxHistory);
        }

        indexRef.current = historyRef.current.length - 1;

        return nextValue;
      });
    },
    [isEqual, maxHistory],
  );

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;

      setValueInternal(historyRef.current[indexRef.current]!);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;

      setValueInternal(historyRef.current[indexRef.current]!);
    }
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [value];
    indexRef.current = 0;
  }, [value]);

  return {
    value,
    setValue,
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    clear,
  };
}
