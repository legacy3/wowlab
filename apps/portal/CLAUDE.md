# apps/portal

Next.js 16 app with shadcn/ui components and Jotai state management.

## File Structure

```
src/
  app/               # Next.js App Router pages
    lab/
      (overview)/    # Route groups for layouts
      inspector/
        spell/[id]/
          page.tsx   # Minimal: renders component
          loading.tsx # Uses *Skeleton component
  components/
    lab/
      inspector/
        spell/
          index.ts           # Barrel exports
          spell-detail-page.tsx
          spell-detail-content.tsx
    ui/              # shadcn components
  atoms/             # Jotai state
    lab/
    settings/
    utils/
```

## Page Pattern

Pages are minimal - just render a component:

```tsx
// app/lab/inspector/spell/[id]/page.tsx
import { SpellDetailPage } from "@/components/lab/inspector/spell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SpellInspectorPage({ params }: Props) {
  const { id } = await params;
  return <SpellDetailPage spellId={id} />;
}
```

## Loading States

Use `loading.tsx` with Skeleton components:

```tsx
// app/lab/inspector/spell/[id]/loading.tsx
import { SpellDetailSkeleton } from "@/components/lab/inspector/spell";

export default function SpellInspectorLoading() {
  return <SpellDetailSkeleton />;
}
```

## Component Naming

Export both `Feature` and `FeatureSkeleton` from same file:

```tsx
// spell-detail-page.tsx
"use client";

export function SpellDetailPage({ spellId }: Props) {
  const spell = useSpellData(spellId);
  return (
    <SpellProvider spell={spell}>
      <SpellDetailContent />
    </SpellProvider>
  );
}

export function SpellDetailSkeleton() {
  return <Skeleton className="..." />;
}
```

## Barrel Exports

Use `index.ts` for clean imports:

```ts
// components/lab/inspector/spell/index.ts
export { SpellDetailPage, SpellDetailSkeleton } from "./spell-detail-page";
export { SpellProvider, useSpellData } from "./spell-context";
```

## Jotai Atoms

Atoms live in domain folders under `atoms/`. Mark with `"use client"`:

```ts
// atoms/lab/state.ts
"use client";

import { createPersistedOrderAtom } from "../utils";

export type LabCardId = "data-inspector" | "spec-coverage" | "table-coverage";

export const labOrderAtom = createPersistedOrderAtom<LabCardId>(
  "lab-order-v4",
  ["data-inspector", "spec-coverage", "table-coverage"],
);
```

## Key Conventions

- **Server components**: Default for pages, fetch data
- **Client components**: `"use client"` for interactivity
- **Jotai hooks**: `useAtom`, `useAtomValue`, `useSetAtom` as needed
- **Suspense**: Wrap async atoms, use Skeleton components
- **shadcn**: Use MCP server for component docs, don't guess APIs
- **Imports**: Use `@/` alias for src/ paths
