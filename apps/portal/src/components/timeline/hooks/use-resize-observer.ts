import { useEffect, useState, useRef, useMemo } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Hook to observe element size changes.
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(element);

    // Initial measurement
    setSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/**
 * Hook to create a throttled callback.
 */
export function useThrottledCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCall = useRef(0);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttled = useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgs.current = args;

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        // Schedule a trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
          () => {
            lastCall.current = Date.now();
            if (lastArgs.current) {
              callback(...lastArgs.current);
            }
          },
          delay - (now - lastCall.current),
        );
      }
    };
    return fn as T;
  }, [callback, delay]);

  return throttled;
}
