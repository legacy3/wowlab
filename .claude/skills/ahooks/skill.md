---
name: ahooks
description: Replace custom React hooks with ahooks library equivalents. Use when auditing hooks, refactoring, or implementing new features that need common hook patterns.
---

# ahooks - React Hooks Library

ahooks is a high-quality React Hooks library. Use it instead of writing custom hooks for common patterns.

## Installation

```bash
pnpm add ahooks
```

## Import Pattern

```ts
import { useRequest, useBoolean, useDebounce } from "ahooks";
```

---

## Quick Reference: When to Use ahooks

| You're Writing...                         | Use This Instead         |
| ----------------------------------------- | ------------------------ |
| `useState(false)` + toggle function       | `useBoolean`             |
| `useState` + toggle between two values    | `useToggle`              |
| `useState({})` + partial updates          | `useSetState`            |
| `useRef` to get latest value in callbacks | `useLatest`              |
| `useCallback` that never changes identity | `useMemoizedFn`          |
| `useEffect` with async function           | `useAsyncEffect`         |
| `useEffect` that skips first render       | `useUpdateEffect`        |
| `useEffect` with deep comparison          | `useDeepCompareEffect`   |
| `useEffect` + `setTimeout`                | `useTimeout`             |
| `useEffect` + `setInterval`               | `useInterval`            |
| `useState` + `useEffect` for debounce     | `useDebounce`            |
| `useState` + `useEffect` for throttle     | `useThrottle`            |
| `useCallback` with debounce               | `useDebounceFn`          |
| `useCallback` with throttle               | `useThrottleFn`          |
| `useRef(null)` + click outside detection  | `useClickAway`           |
| `useEffect` + `addEventListener`          | `useEventListener`       |
| `useState` synced to localStorage         | `useLocalStorageState`   |
| `useState` synced to sessionStorage       | `useSessionStorageState` |
| `useState` synced to URL query params     | `useUrlState`            |
| `useRef` + previous value tracking        | `usePrevious`            |
| `useState` + `useEffect` for fetch        | `useRequest`             |
| Manual loading/error state management     | `useRequest`             |
| Countdown timer logic                     | `useCountDown`           |
| Counter with inc/dec/reset                | `useCounter`             |
| `useEffect` cleanup on unmount            | `useUnmount`             |
| `useEffect` with empty deps for mount     | `useMount`               |
| Force re-render function                  | `useUpdate`              |
| Hover state detection                     | `useHover`               |
| Element size observation                  | `useSize`                |
| Scroll position tracking                  | `useScroll`              |
| Keyboard shortcut handling                | `useKeyPress`            |
| IntersectionObserver logic                | `useInViewport`          |
| Document title management                 | `useTitle`               |
| Fullscreen API                            | `useFullscreen`          |
| Network online/offline status             | `useNetwork`             |
| Drag and drop                             | `useDrag` / `useDrop`    |
| Long press gesture                        | `useLongPress`           |
| Mouse position tracking                   | `useMouse`               |
| List selection management                 | `useSelections`          |
| Undo/redo history                         | `useHistoryTravel`       |
| WebSocket connection                      | `useWebSocket`           |
| Virtual list rendering                    | `useVirtualList`         |
| Infinite scroll                           | `useInfiniteScroll`      |
| Pagination                                | `usePagination`          |
| Controlled/uncontrolled component         | `useControllableValue`   |

---

## STATE HOOKS

### useBoolean

Manage boolean state with convenient actions.

**Replace this:**

```ts
const [visible, setVisible] = useState(false);
const toggle = () => setVisible((v) => !v);
const show = () => setVisible(true);
const hide = () => setVisible(false);
```

**With this:**

```ts
const [visible, { toggle, setTrue: show, setFalse: hide, set }] =
  useBoolean(false);
```

**API:**

```ts
const [state, { toggle, set, setTrue, setFalse }] = useBoolean(defaultValue?: boolean);
```

---

### useToggle

Toggle between any two values (not just boolean).

**Replace this:**

```ts
const [mode, setMode] = useState<"light" | "dark">("light");
const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
```

**With this:**

```ts
const [mode, { toggle, set, setLeft, setRight }] = useToggle<"light" | "dark">(
  "light",
  "dark",
);
```

**API:**

```ts
const [state, { toggle, set, setLeft, setRight }] = useToggle<T, U>(
  defaultValue: T,
  reverseValue?: U
);
```

---

### useSetState

Manage object state with partial updates (like class component setState).

**Replace this:**

```ts
const [state, setState] = useState({ name: "", age: 0, email: "" });
const updateName = (name: string) => setState((s) => ({ ...s, name }));
```

**With this:**

```ts
const [state, setState] = useSetState({ name: "", age: 0, email: "" });
setState({ name: "John" }); // Partial update, preserves other fields
```

**API:**

```ts
const [state, setState] = useSetState<T extends object>(initialState: T);
setState(patch: Partial<T> | ((prev: T) => Partial<T>));
```

---

### useDebounce

Debounce a value.

**Replace this:**

```ts
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 500);
  return () => clearTimeout(timer);
}, [search]);
```

**With this:**

```ts
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, { wait: 500 });
```

**API:**

```ts
const debouncedValue = useDebounce(value: any, { wait?: number, leading?: boolean, trailing?: boolean, maxWait?: number });
```

---

### useThrottle

Throttle a value.

**Replace this:**

```ts
const [position, setPosition] = useState({ x: 0, y: 0 });
const [throttledPosition, setThrottledPosition] = useState({ x: 0, y: 0 });
const lastUpdate = useRef(0);

useEffect(() => {
  const now = Date.now();
  if (now - lastUpdate.current >= 100) {
    setThrottledPosition(position);
    lastUpdate.current = now;
  }
}, [position]);
```

**With this:**

```ts
const [position, setPosition] = useState({ x: 0, y: 0 });
const throttledPosition = useThrottle(position, { wait: 100 });
```

**API:**

```ts
const throttledValue = useThrottle(value: any, { wait?: number, leading?: boolean, trailing?: boolean });
```

---

### usePrevious

Get the previous value of a state.

**Replace this:**

```ts
const [count, setCount] = useState(0);
const prevCountRef = useRef<number>();

useEffect(() => {
  prevCountRef.current = count;
});

const prevCount = prevCountRef.current;
```

**With this:**

```ts
const [count, setCount] = useState(0);
const prevCount = usePrevious(count);
```

**API:**

```ts
const previousValue = usePrevious<T>(value: T): T | undefined;
```

---

### useLocalStorageState

Sync state with localStorage.

**Replace this:**

```ts
const [theme, setTheme] = useState(() => {
  const saved = localStorage.getItem("theme");
  return saved ? JSON.parse(saved) : "light";
});

useEffect(() => {
  localStorage.setItem("theme", JSON.stringify(theme));
}, [theme]);
```

**With this:**

```ts
const [theme, setTheme] = useLocalStorageState("theme", {
  defaultValue: "light",
});
```

**API:**

```ts
const [state, setState] = useLocalStorageState<T>(
  key: string,
  { defaultValue?: T, serializer?: (value: T) => string, deserializer?: (value: string) => T }
);
```

---

### useSessionStorageState

Same as useLocalStorageState but for sessionStorage.

```ts
const [token, setToken] = useSessionStorageState("auth-token", {
  defaultValue: "",
});
```

---

### useMap

Manage Map state.

**Replace this:**

```ts
const [map, setMap] = useState(new Map<string, number>());
const set = (key: string, value: number) =>
  setMap((m) => new Map(m).set(key, value));
const remove = (key: string) => {
  setMap((m) => {
    const next = new Map(m);
    next.delete(key);
    return next;
  });
};
```

**With this:**

```ts
const [map, { set, get, remove, reset, setAll }] = useMap<string, number>();
```

**API:**

```ts
const [map, { set, setAll, remove, reset, get }] = useMap<K, V>(initialValue?: Iterable<[K, V]>);
```

---

### useSet

Manage Set state.

**Replace this:**

```ts
const [selected, setSelected] = useState(new Set<string>());
const add = (id: string) => setSelected((s) => new Set(s).add(id));
const remove = (id: string) => {
  setSelected((s) => {
    const next = new Set(s);
    next.delete(id);
    return next;
  });
};
```

**With this:**

```ts
const [selected, { add, remove, reset, has }] = useSet<string>();
```

**API:**

```ts
const [set, { add, remove, reset, has }] = useSet<T>(initialValue?: Iterable<T>);
```

---

### useCounter

Counter with increment, decrement, and bounds.

**Replace this:**

```ts
const [count, setCount] = useState(0);
const increment = () => setCount((c) => Math.min(c + 1, 10));
const decrement = () => setCount((c) => Math.max(c - 1, 0));
const reset = () => setCount(0);
```

**With this:**

```ts
const [count, { inc, dec, set, reset }] = useCounter(0, { min: 0, max: 10 });
```

**API:**

```ts
const [count, { inc, dec, set, reset }] = useCounter(
  initialValue?: number,
  { min?: number, max?: number }
);
```

---

### useRafState

State that only updates on requestAnimationFrame (for high-frequency updates).

**Use when:** Updating state from mousemove, scroll, or animation events.

```ts
const [position, setPosition] = useRafState({ x: 0, y: 0 });

// High-frequency updates are batched to animation frames
onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
```

---

### useSafeState

Prevents setState on unmounted components.

**Use when:** Setting state after async operations that might complete after unmount.

```ts
const [data, setData] = useSafeState(null);

useEffect(() => {
  fetchData().then(setData); // Won't warn if component unmounts
}, []);
```

---

### useGetState

Get the latest state value synchronously (useful in closures).

```ts
const [count, setCount, getCount] = useGetState(0);

const alertCount = () => {
  setTimeout(() => {
    alert(getCount()); // Gets current value, not stale closure value
  }, 3000);
};
```

---

### useResetState

State with a reset function to restore initial value.

```ts
const [state, setState, resetState] = useResetState({ name: "", email: "" });

// Later...
resetState(); // Restores to { name: '', email: '' }
```

---

## EFFECT HOOKS

### useMount

Run effect only on mount.

**Replace this:**

```ts
useEffect(() => {
  console.log("Mounted");
}, []);
```

**With this:**

```ts
useMount(() => {
  console.log("Mounted");
});
```

---

### useUnmount

Run effect only on unmount.

**Replace this:**

```ts
useEffect(() => {
  return () => {
    console.log("Unmounted");
  };
}, []);
```

**With this:**

```ts
useUnmount(() => {
  console.log("Unmounted");
});
```

---

### useUnmountedRef

Get a ref that indicates if component is unmounted.

```ts
const unmountedRef = useUnmountedRef();

const handleClick = async () => {
  await someAsyncOperation();
  if (!unmountedRef.current) {
    // Safe to update state
  }
};
```

---

### useUpdateEffect

Like useEffect but skips the first render.

**Replace this:**

```ts
const isFirst = useRef(true);

useEffect(() => {
  if (isFirst.current) {
    isFirst.current = false;
    return;
  }
  console.log("Value changed:", value);
}, [value]);
```

**With this:**

```ts
useUpdateEffect(() => {
  console.log("Value changed:", value);
}, [value]);
```

---

### useUpdateLayoutEffect

Like useLayoutEffect but skips the first render.

```ts
useUpdateLayoutEffect(() => {
  // Runs synchronously after DOM mutations, but not on first render
}, [value]);
```

---

### useAsyncEffect

Handle async functions in useEffect properly.

**Replace this:**

```ts
useEffect(() => {
  const load = async () => {
    const data = await fetchData();
    setData(data);
  };
  load();
}, []);
```

**With this:**

```ts
useAsyncEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);
```

**API:**

```ts
useAsyncEffect(
  effect: () => AsyncGenerator<void, void, void> | Promise<void>,
  deps?: DependencyList
);
```

---

### useDebounceEffect

Debounced useEffect.

**Replace this:**

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    search(query);
  }, 500);
  return () => clearTimeout(timer);
}, [query]);
```

**With this:**

```ts
useDebounceEffect(
  () => {
    search(query);
  },
  [query],
  { wait: 500 },
);
```

**API:**

```ts
useDebounceEffect(effect: EffectCallback, deps?: DependencyList, { wait?: number, leading?: boolean, trailing?: boolean, maxWait?: number });
```

---

### useThrottleEffect

Throttled useEffect.

```ts
useThrottleEffect(
  () => {
    trackScroll(scrollPosition);
  },
  [scrollPosition],
  { wait: 100 },
);
```

---

### useDeepCompareEffect

useEffect with deep comparison of dependencies.

**Use when:** Dependencies are objects/arrays that are recreated each render but have same values.

```ts
useDeepCompareEffect(() => {
  // Only runs when config deeply changes
  initializeWithConfig(config);
}, [config]); // config is { a: 1, b: { c: 2 } }
```

---

### useDeepCompareLayoutEffect

useLayoutEffect with deep comparison.

---

### useIsomorphicLayoutEffect

useLayoutEffect on client, useEffect on server (for SSR).

```ts
useIsomorphicLayoutEffect(() => {
  // Safe for SSR - uses useEffect on server
}, []);
```

---

### useInterval

Declarative setInterval.

**Replace this:**

```ts
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**With this:**

```ts
useInterval(() => {
  setCount((c) => c + 1);
}, 1000);
```

**API:**

```ts
useInterval(
  fn: () => void,
  delay?: number | undefined, // undefined to pause
  { immediate?: boolean }
);
```

---

### useTimeout

Declarative setTimeout.

**Replace this:**

```ts
useEffect(() => {
  const id = setTimeout(() => {
    setVisible(true);
  }, 3000);
  return () => clearTimeout(id);
}, []);
```

**With this:**

```ts
useTimeout(() => {
  setVisible(true);
}, 3000);
```

---

### useRafInterval

setInterval using requestAnimationFrame (more efficient for animations).

```ts
useRafInterval(() => {
  updateAnimation();
}, 16); // ~60fps
```

---

### useRafTimeout

setTimeout using requestAnimationFrame.

---

### useLockFn

Prevent concurrent execution of async functions.

**Replace this:**

```ts
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  if (loading) return;
  setLoading(true);
  try {
    await submit();
  } finally {
    setLoading(false);
  }
};
```

**With this:**

```ts
const handleSubmit = useLockFn(async () => {
  await submit();
});
```

---

### useUpdate

Force component re-render.

```ts
const update = useUpdate();

// Later...
update(); // Forces re-render
```

---

## FUNCTION HOOKS

### useMemoizedFn

Create a function with stable identity (never changes between renders).

**Replace this:**

```ts
const handleClick = useCallback(() => {
  console.log(count); // Stale closure if count not in deps
}, [count]);
```

**With this:**

```ts
const handleClick = useMemoizedFn(() => {
  console.log(count); // Always gets latest count, stable identity
});
```

**Why use it:**

- No dependency array needed
- Always accesses latest state/props
- Never causes child re-renders due to function identity change
- Fixes closure problems

---

### useLatest

Get a ref that always contains the latest value.

**Replace this:**

```ts
const countRef = useRef(count);

useEffect(() => {
  countRef.current = count;
}, [count]);
```

**With this:**

```ts
const countRef = useLatest(count);
// countRef.current is always the latest count
```

---

### useDebounceFn

Debounce a function.

**Replace this:**

```ts
const debouncedSearch = useMemo(
  () => debounce((query: string) => search(query), 500),
  [],
);
```

**With this:**

```ts
const {
  run: debouncedSearch,
  cancel,
  flush,
} = useDebounceFn((query: string) => search(query), { wait: 500 });
```

**API:**

```ts
const { run, cancel, flush } = useDebounceFn(
  fn: (...args: any[]) => any,
  { wait?: number, leading?: boolean, trailing?: boolean, maxWait?: number }
);
```

---

### useThrottleFn

Throttle a function.

```ts
const { run: throttledTrack } = useThrottleFn(
  (position: number) => trackPosition(position),
  { wait: 100 },
);
```

---

### useCreation

Like useMemo but with guaranteed stability (never recalculates unless deps change).

**Use when:** useMemo's "may recalculate" behavior is problematic.

```ts
const instance = useCreation(() => new ExpensiveClass(), []);
// Guaranteed to be the same instance
```

---

## DOM HOOKS

### useEventListener

Add event listeners declaratively.

**Replace this:**

```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

**With this:**

```ts
useEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
```

**API:**

```ts
useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  { target?: Element | Window | Document, capture?: boolean, once?: boolean, passive?: boolean }
);
```

---

### useClickAway

Detect clicks outside an element.

**Replace this:**

```ts
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      close();
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);
```

**With this:**

```ts
const ref = useRef<HTMLDivElement>(null);
useClickAway(() => close(), ref);
```

**API:**

```ts
useClickAway(
  onClickAway: (event: MouseEvent | TouchEvent) => void,
  target: RefObject<Element> | Element | (() => Element),
  eventName?: 'click' | 'mousedown' | 'mouseup' | 'touchstart' | 'touchend'
);
```

---

### useHover

Track hover state of an element.

**Replace this:**

```ts
const [isHovered, setIsHovered] = useState(false);
<div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} />
```

**With this:**

```ts
const ref = useRef<HTMLDivElement>(null);
const isHovered = useHover(ref);
```

**API:**

```ts
const isHovering = useHover(target: RefObject<Element>, { onEnter?: () => void, onLeave?: () => void, onChange?: (isHovering: boolean) => void });
```

---

### useScroll

Track scroll position of an element.

```ts
const ref = useRef<HTMLDivElement>(null);
const scroll = useScroll(ref);
// scroll = { left: number, top: number }
```

---

### useSize

Track element size using ResizeObserver.

**Replace this:**

```ts
const ref = useRef<HTMLDivElement>(null);
const [size, setSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  const observer = new ResizeObserver(([entry]) => {
    setSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
```

**With this:**

```ts
const ref = useRef<HTMLDivElement>(null);
const size = useSize(ref);
// size = { width: number, height: number } | undefined
```

---

### useInViewport

Check if element is in viewport using IntersectionObserver.

```ts
const ref = useRef<HTMLDivElement>(null);
const [inViewport, ratio] = useInViewport(ref, { threshold: 0.5 });
// inViewport: boolean, ratio: number (0-1)
```

---

### useMouse

Track mouse position.

```ts
const mouse = useMouse();
// mouse = { clientX, clientY, pageX, pageY, screenX, screenY, elementX, elementY, elementW, elementH }
```

---

### useKeyPress

Handle keyboard shortcuts.

**Replace this:**

```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) submit();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

**With this:**

```ts
useKeyPress(["ctrl.enter"], () => submit());
```

**API:**

```ts
useKeyPress(
  keyFilter: string | string[] | ((event: KeyboardEvent) => boolean),
  eventHandler: (event: KeyboardEvent) => void,
  { events?: ('keydown' | 'keyup')[], target?: Element, exactMatch?: boolean }
);
```

**Key combinations:** `'ctrl.s'`, `'meta.enter'`, `'shift.tab'`, `'alt.a'`

---

### useLongPress

Detect long press gesture.

```ts
useLongPress(() => console.log("Long pressed!"), ref, {
  delay: 1000,
  onClick: () => console.log("Clicked"),
});
```

---

### useTitle

Set document title.

**Replace this:**

```ts
useEffect(() => {
  document.title = `${page} - My App`;
}, [page]);
```

**With this:**

```ts
useTitle(`${page} - My App`);
```

---

### useFavicon

Set document favicon.

```ts
useFavicon("/favicon-dark.ico");
```

---

### useFullscreen

Fullscreen API wrapper.

```ts
const ref = useRef<HTMLDivElement>(null);
const [isFullscreen, { enterFullscreen, exitFullscreen, toggleFullscreen }] =
  useFullscreen(ref);
```

---

### useDocumentVisibility

Track document visibility state.

```ts
const visibility = useDocumentVisibility();
// visibility = 'visible' | 'hidden'

useEffect(() => {
  if (visibility === "hidden") pauseVideo();
}, [visibility]);
```

---

### useFocusWithin

Track if focus is within a container.

```ts
const ref = useRef<HTMLDivElement>(null);
const isFocusWithin = useFocusWithin(ref, {
  onFocus: () => console.log("Focus entered"),
  onBlur: () => console.log("Focus left"),
});
```

---

### useMutationObserver

MutationObserver wrapper.

```ts
useMutationObserver((mutations) => console.log(mutations), ref, {
  childList: true,
  subtree: true,
});
```

---

### useEventTarget

Input value binding.

```ts
const [value, { reset, onChange }] = useEventTarget({ initialValue: '' });

<input value={value} onChange={onChange} />
<button onClick={reset}>Clear</button>
```

---

### useExternal

Load external scripts/styles.

```ts
const status = useExternal("https://cdn.example.com/lib.js", { type: "js" });
// status = 'loading' | 'ready' | 'error'
```

---

### useDrag / useDrop

Drag and drop handling.

```ts
const getDragProps = useDrag({ onDragStart: () => console.log('Dragging') });
const [isHovering, dropProps] = useDrop({ onDom: (content) => console.log(content) });

<div {...getDragProps(item)}>Drag me</div>
<div {...dropProps}>Drop here</div>
```

---

### useResponsive

Responsive breakpoint detection.

```ts
const responsive = useResponsive();
// responsive = { xs: true, sm: true, md: true, lg: false, xl: false }
```

---

## ADVANCED HOOKS

### useRequest

Powerful data fetching hook with loading, error, caching, polling, and more.

**Replace this:**

```ts
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.getData();
    setData(result);
  } catch (e) {
    setError(e);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []);
```

**With this:**

```ts
const { data, loading, error, refresh, run } = useRequest(() => api.getData());
```

**API:**

```ts
const {
  data,
  error,
  loading,
  params,
  run,
  runAsync,
  refresh,
  refreshAsync,
  mutate,
  cancel,
} = useRequest(
  service: (...args: TParams) => Promise<TData>,
  {
    manual?: boolean,              // Don't run on mount
    defaultParams?: TParams,       // Default params for auto-run
    onBefore?: (params) => void,
    onSuccess?: (data, params) => void,
    onError?: (error, params) => void,
    onFinally?: (params, data, error) => void,

    // Polling
    pollingInterval?: number,
    pollingWhenHidden?: boolean,
    pollingErrorRetryCount?: number,

    // Debounce/Throttle
    debounceWait?: number,
    throttleWait?: number,

    // Cache
    cacheKey?: string,
    cacheTime?: number,
    staleTime?: number,

    // Retry
    retryCount?: number,
    retryInterval?: number,

    // Ready
    ready?: boolean,

    // Refresh on deps change
    refreshDeps?: DependencyList,
    refreshDepsAction?: () => void,

    // Loading delay (prevent flash)
    loadingDelay?: number,
  }
);
```

---

### usePagination

Pagination built on useRequest.

```ts
const { data, loading, pagination } = usePagination(
  ({ current, pageSize }) => api.getList({ page: current, size: pageSize }),
  { defaultPageSize: 20 },
);

// pagination = { current, pageSize, total, totalPage, onChange, changeCurrent, changePageSize }
```

---

### useInfiniteScroll

Infinite scrolling.

```ts
const { data, loading, loadingMore, noMore, loadMore } = useInfiniteScroll(
  (d) => api.getList({ cursor: d?.nextCursor }),
  {
    target: containerRef,
    isNoMore: (d) => !d?.hasMore,
  },
);
```

---

### useVirtualList

Virtual list for large datasets.

```ts
const [list, scrollTo] = useVirtualList(originalList, {
  containerTarget: containerRef,
  wrapperTarget: wrapperRef,
  itemHeight: 50,
  overscan: 5,
});

// Render only `list` items, not the full originalList
```

---

### useControllableValue

Handle controlled/uncontrolled component pattern.

```ts
// Works both ways:
// <MyInput value={val} onChange={setVal} />  (controlled)
// <MyInput defaultValue="hi" />              (uncontrolled)

function MyInput(props) {
  const [value, setValue] = useControllableValue(props, { defaultValue: '' });
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

---

### useEventEmitter

Event emitter pattern for cross-component communication.

```ts
// Create emitter
const event$ = useEventEmitter<string>();

// Subscribe
useSubscription(event$, (val) => console.log(val));

// Emit
event$.emit("hello");
```

---

### useReactive

Reactive object state (like Vue's reactive).

```ts
const state = useReactive({
  count: 0,
  name: "John",
  nested: { value: 1 },
});

// Mutate directly
state.count++;
state.nested.value = 2;
```

---

## SCENE HOOKS

### useNetwork

Network online/offline status.

```ts
const { online, since, rtt, type, downlink, effectiveType } = useNetwork();

if (!online) {
  return <OfflineWarning />;
}
```

---

### useSelections

List selection management.

```ts
const {
  selected,
  allSelected,
  noneSelected,
  partiallySelected,
  isSelected,
  toggle,
  toggleAll,
  select,
  unSelect,
  selectAll,
  unSelectAll,
  setSelected,
} = useSelections(items, defaultSelected);
```

---

### useHistoryTravel

Undo/redo history.

```ts
const { value, setValue, backLength, forwardLength, back, forward, go, reset } =
  useHistoryTravel<string>("");

setValue("a");
setValue("b");
back(); // value = 'a'
forward(); // value = 'b'
```

---

### useCountDown

Countdown timer.

**Replace this:**

```ts
const [remaining, setRemaining] = useState(60);

useEffect(() => {
  if (remaining <= 0) return;
  const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
  return () => clearTimeout(timer);
}, [remaining]);
```

**With this:**

```ts
const [countdown, { days, hours, minutes, seconds }] = useCountDown({
  targetDate: Date.now() + 60000,
  onEnd: () => console.log("Done!"),
});
```

---

### useWebSocket

WebSocket connection management.

```ts
const { readyState, sendMessage, latestMessage, disconnect, connect } =
  useWebSocket("wss://example.com/ws", {
    onOpen: () => console.log("Connected"),
    onMessage: (msg) => console.log(msg),
    onError: (err) => console.error(err),
    onClose: () => console.log("Closed"),
    reconnectLimit: 3,
    reconnectInterval: 3000,
  });
```

---

## DEV HOOKS (Debug Only)

### useTrackedEffect

Debug which dependency triggered the effect.

```ts
useTrackedEffect(
  (changes) => {
    console.log("Changed deps:", changes);
    // changes = [0, 2] means deps[0] and deps[2] changed
  },
  [a, b, c],
);
```

---

### useWhyDidYouUpdate

Debug why component re-rendered.

```ts
useWhyDidYouUpdate("MyComponent", props);
// Logs: { propName: { from: oldValue, to: newValue } }
```

---

## Migration Examples

### Example 1: Loading State Management

**Before (manual):**

```ts
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchItems()
    .then(setItems)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

const handleRefresh = async () => {
  setLoading(true);
  try {
    const data = await fetchItems();
    setItems(data);
  } catch (e) {
    setError(e);
  } finally {
    setLoading(false);
  }
};
```

**After (ahooks):**

```ts
const { data: items, loading, error, refresh } = useRequest(fetchItems);
```

---

### Example 2: Debounced Search

**Before:**

```ts
const [query, setQuery] = useState("");
const [results, setResults] = useState([]);

useEffect(() => {
  const timer = setTimeout(async () => {
    if (query) {
      const data = await search(query);
      setResults(data);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

**After:**

```ts
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, { wait: 300 });
const { data: results } = useRequest(() => search(debouncedQuery), {
  refreshDeps: [debouncedQuery],
  ready: !!debouncedQuery,
});
```

---

### Example 3: Modal with Click Away

**Before:**

```ts
const [open, setOpen] = useState(false);
const modalRef = useRef(null);

useEffect(() => {
  if (!open) return;
  const handler = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setOpen(false);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [open]);
```

**After:**

```ts
const [open, { setFalse: close, setTrue: openModal }] = useBoolean(false);
const modalRef = useRef(null);
useClickAway(close, modalRef);
```

---

## Do NOT Use ahooks For

1. **Server data caching** - Use React Query (TanStack Query) instead for:
   - Query invalidation
   - Optimistic updates
   - Background refetching
   - Cache persistence

2. **Global state** - Use Zustand for:
   - Selection state
   - UI preferences
   - Editor state

3. **Form state** - Use react-hook-form or Formik

4. **Animation** - Use framer-motion

ahooks is for **utility hooks** that replace common patterns, not for data/state architecture.
