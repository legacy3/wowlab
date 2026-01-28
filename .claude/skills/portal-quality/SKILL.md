---
name: portal-quality
description: TypeScript/React/Next.js quality control for apps/portal. Use when reviewing portal code, auditing components, or checking for anti-patterns.
allowed-tools: Read, Grep, Glob, Bash
---

# Portal Quality Control

Comprehensive quality standards for the `apps/portal` TypeScript/React/Next.js codebase.

## Quick Commands

```bash
cd apps/portal

# Quality checks
pnpm lint
pnpm build  # includes type checking

# Find issues
grep -rn "as [A-Z]" src/ --include="*.ts" --include="*.tsx"  # type assertions
grep -rn "console\." src/ --include="*.ts" --include="*.tsx"  # console statements
grep -rn "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx"  # todos
```

---

## TypeScript Anti-Patterns

### 1. Type Assertions (`as`)

```typescript
// WRONG - bypasses type checking
const data = response as MyType;
const id = event.active.id as string;

// RIGHT - use type guards
function isMyType(value: unknown): value is MyType {
  return typeof value === "object" && value !== null && "id" in value;
}
if (isMyType(response)) {
  const data = response; // correctly typed
}

// RIGHT - use satisfies for validation
const config = { ... } satisfies Config;
```

**Known violations to check:**

- `components/ui/charts/analysis-chart.tsx` - scale type assertions
- `components/editor/preview.tsx` - RuleGroupType assertions
- `lib/state/editor.ts` - JSON.parse assertions

### 2. Loose Typing (`unknown`, `any`, `Record<string, unknown>`)

```typescript
// WRONG - defeats type safety
interface Props {
  data: unknown;
  value: unknown;
  components?: Record<string, ComponentType>;
}

// RIGHT - use discriminated unions or generics
interface Props<T extends BaseData> {
  data: T;
  value: T["value"];
}

// RIGHT - explicit union types
type Data = SpellData | ItemData | PlayerData;
```

### 3. Unsafe JSON Operations

```typescript
// WRONG - no validation
const data = JSON.parse(jsonString) as MyType;

// RIGHT - validate with schema
import { z } from "zod";
const MySchema = z.object({ ... });
const data = MySchema.parse(JSON.parse(jsonString));

// RIGHT - use try-catch with type guard
try {
  const parsed = JSON.parse(jsonString);
  if (isMyType(parsed)) {
    return parsed;
  }
} catch {
  return defaultValue;
}
```

### 4. Object.assign for State Updates

```typescript
// WRONG - direct mutation pattern
Object.assign(state, newValues);
Object.assign(action, updates);

// RIGHT - with immer (if using zustand with immer)
set((state) => {
  state.value = newValue; // immer handles immutability
});

// RIGHT - spread operator
set({ ...state, ...newValues });
```

---

## React Anti-Patterns

### 1. useEffect Overuse

```typescript
// WRONG - derived state in useEffect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// RIGHT - compute during render
const fullName = `${firstName} ${lastName}`;

// RIGHT - use useMemo for expensive computations
const fullName = useMemo(
  () => expensiveComputation(firstName, lastName),
  [firstName, lastName],
);
```

### 2. Missing Cleanup in useEffect

```typescript
// WRONG - potential memory leak
useEffect(() => {
  fetchData().then(setData);
}, []);

// RIGHT - with cleanup
useEffect(() => {
  let cancelled = false;
  fetchData().then((result) => {
    if (!cancelled) setData(result);
  });
  return () => {
    cancelled = true;
  };
}, []);

// BETTER - use React Query
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
});
```

### 3. Missing Dependencies

```typescript
// WRONG - stale closure
useEffect(() => {
  doSomething(value); // value not in deps
}, []);

// RIGHT - include all dependencies
useEffect(() => {
  doSomething(value);
}, [value]);

// WRONG - callback recreated every render
<Button onClick={() => handleClick(id)} />

// RIGHT - stable callback
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);
<Button onClick={handleButtonClick} />
```

### 4. Creating Components Inside Render

```typescript
// WRONG - component re-mounts on every render
function Parent() {
  const Child = () => <div>{...}</div>; // BAD!
  return <Child />;
}

// RIGHT - define outside
const Child = () => <div>{...}</div>;
function Parent() {
  return <Child />;
}
```

### 5. dangerouslySetInnerHTML

```typescript
// AVOID when possible
<div dangerouslySetInnerHTML={{ __html: content }} />

// PREFER - React components or sanitized content
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />

// BEST - use MDX or structured rendering
<MDXContent content={content} />
```

---

## Next.js Patterns

### 1. Server vs Client Components

```typescript
// WRONG - "use client" on data-fetching components
"use client";
export default function Page() {
  const data = await fetchData(); // won't work!
}

// RIGHT - keep data fetching on server
// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// client-component.tsx
"use client";
export function ClientComponent({ data }: Props) {
  const [state, setState] = useState(data);
  // ... interactivity
}
```

### 2. Client Component Boundaries

```typescript
// WRONG - entire layout is client
"use client";
export default function Layout({ children }) { ... }

// RIGHT - move interactivity to leaf components
export default function Layout({ children }) {
  return (
    <div>
      <Header />  {/* Server */}
      <Sidebar /> {/* Server, contains <SearchBar /> which is Client */}
      {children}
    </div>
  );
}
```

### 3. Loading States

```typescript
// WRONG - using Loader2 from lucide
import { Loader2 } from "lucide-react";
<Loader2 className="animate-spin" />

// RIGHT - use Flask loaders from the project
import { Flask } from "@/components/ui/loader";
<Flask size="md" />
```

---

## State Management

### 1. Server State (React Query)

```typescript
// Use for: API data, database fetches, external state

// queries.ts
export function useSpell(id: string | undefined) {
  return useQuery({
    queryKey: ["spells", id],
    queryFn: () => fetchSpell(id!),
    enabled: !!id,
  });
}

// mutations.ts
export function useSaveSpell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveSpell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spells"] });
    },
  });
}
```

### 2. Client State (Zustand)

```typescript
// Use for: UI state, selections, editor state

// store.ts
"use client";
import { create } from "zustand";

interface SelectionStore {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useSelection = create<SelectionStore>()((set, get) => ({
  selectedIds: new Set(),
  toggle: (id) => {
    const selected = new Set(get().selectedIds);
    selected.has(id) ? selected.delete(id) : selected.add(id);
    set({ selectedIds: selected });
  },
  clear: () => set({ selectedIds: new Set() }),
}));
```

### 3. NEVER Do This

```typescript
// WRONG - server data in Zustand
const useStore = create((set) => ({
  spells: [], // Should be React Query
  isLoading: true, // Should be React Query
}));

// WRONG - manual fetch + setState
useEffect(() => {
  fetch("/api/data")
    .then((r) => r.json())
    .then(setData);
}, []);

// WRONG - data hooks in hooks/
// hooks/use-spell-data.ts <-- NO!

// RIGHT - data hooks in lib/state/{domain}/
// lib/state/game/queries.ts
```

---

## Component Structure

### File Size Limits

| Type      | Max Lines | Action if Exceeded            |
| --------- | --------- | ----------------------------- |
| Component | 200       | Split into smaller components |
| Hook      | 100       | Extract logic to utilities    |
| Utility   | 150       | Split by responsibility       |

**Known large files to refactor:**

- `components/dev/metrics/shared.tsx` (752 lines)
- `components/ui/loader.tsx` (610 lines)
- `components/rotations/rotation-browser.tsx` (569 lines)

### Directory Structure

```
components/feature/
├── index.ts           # Barrel exports
├── feature-page.tsx   # Main component + skeleton
├── feature-content.tsx
├── feature-form.tsx
└── use-feature.ts     # Component-specific hooks (not data)
```

---

## Formatting

Always use `@/lib/format` utilities:

```typescript
// WRONG
value.toLocaleString();
new Date(date).toLocaleDateString()`${duration}ms`(percent * 100).toFixed(1) +
  "%";

// RIGHT
import {
  formatInt,
  formatRelativeToNow,
  formatDurationMs,
  formatPercent,
} from "@/lib/format";

formatInt(value); // "1,234,567"
formatRelativeToNow(date); // "2 hours ago"
formatDurationMs(duration); // "5s"
formatPercent(percent); // "85.5%"
```

---

## Styling

Use Panda CSS, not Tailwind:

```typescript
// WRONG
<div className="flex items-center gap-4 p-2">

// RIGHT
import { HStack } from "styled-system/jsx";
import { css } from "styled-system/css";

<HStack gap="4" padding="2">
<div className={css({ display: "flex", alignItems: "center" })}>
```

---

## Quality Checklist

### Every Component

- [ ] No type assertions (`as Type`)
- [ ] No `console.log` statements
- [ ] Control flow has braces
- [ ] useEffect has proper cleanup
- [ ] Dependencies array is complete
- [ ] Uses `@/lib/format` for formatting
- [ ] Uses Panda CSS for styling

### Every Hook

- [ ] Lives in correct location (lib/state/ for data, hooks/ for utilities)
- [ ] No stale closures
- [ ] Memoization where appropriate
- [ ] Documented if public API

### Every Page

- [ ] Minimal page.tsx (just renders component)
- [ ] Has loading.tsx with skeleton
- [ ] Server Component by default
- [ ] "use client" only where needed

---

## Audit Commands

```bash
# Type assertions
grep -rn " as [A-Z]" apps/portal/src/ --include="*.ts" --include="*.tsx" | grep -v "satisfies"

# Console statements
grep -rn "console\." apps/portal/src/ --include="*.ts" --include="*.tsx"

# TODO comments
grep -rn "TODO\|FIXME" apps/portal/src/ --include="*.ts" --include="*.tsx"

# Large files
find apps/portal/src -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20

# dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML" apps/portal/src/

# useEffect without cleanup
grep -rn "useEffect.*=>" apps/portal/src/ --include="*.tsx" -A 5 | grep -v "return"
```
