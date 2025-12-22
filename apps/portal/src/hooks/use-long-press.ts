import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  delay?: number;
  onStart?: () => void;
  onCancel?: () => void;
}

interface UseLongPressReturn {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {},
): UseLongPressReturn {
  const { delay = 400, onStart, onCancel } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(() => {
    triggeredRef.current = false;
    onStart?.();
    clear();
    timeoutRef.current = setTimeout(() => {
      triggeredRef.current = true;
      callback();
    }, delay);
  }, [callback, clear, delay, onStart]);

  const onTouchEnd = useCallback(() => {
    clear();
    if (!triggeredRef.current) {
      onCancel?.();
    }
  }, [clear, onCancel]);

  const onTouchMove = useCallback(() => {
    clear();
    onCancel?.();
  }, [clear, onCancel]);

  return { onTouchStart, onTouchEnd, onTouchMove };
}
