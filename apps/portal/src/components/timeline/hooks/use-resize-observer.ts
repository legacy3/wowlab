import { useEffect, useState, useCallback, useRef } from "react";

interface Size {
  width: number;
  height: number;
}

export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial size
    setSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    // Create observer
    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observerRef.current.observe(element);

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [ref]);

  return size;
}

// Throttled callback hook for high-frequency events like mouse move
export function useThrottledCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCall = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          lastCall.current = Date.now();
          callback(...args);
        });
      }
    }) as T,
    [callback, delay],
  );
}
