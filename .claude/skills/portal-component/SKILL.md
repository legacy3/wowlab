---
name: portal-component
description: Generate Next.js components for the portal app with proper patterns. Use when creating new pages, components, or features in apps/portal.
---

# Portal Component Generator

Generate Next.js 16 components following portal conventions.

## Page Structure

For a new feature at `/app/feature/page.tsx`:

```
app/feature/
├── page.tsx           # Minimal, renders component
├── loading.tsx        # Uses FeatureSkeleton
└── layout.tsx         # Optional layout wrapper

components/feature/
├── index.ts           # Barrel exports
├── feature-page.tsx   # Main component + skeleton
├── feature-content.tsx # Inner content
└── feature-context.tsx # Optional context/provider
```

## Page Template

```tsx
// app/feature/page.tsx
import { FeaturePage } from "@/components/feature";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeatureRoute({ params }: Props) {
  const { id } = await params;
  return <FeaturePage featureId={id} />;
}
```

## Loading Template

```tsx
// app/feature/loading.tsx
import { FeatureSkeleton } from "@/components/feature";

export default function FeatureLoading() {
  return <FeatureSkeleton />;
}
```

## Component Template

```tsx
// components/feature/feature-page.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface FeaturePageProps {
  featureId: string;
}

export function FeaturePage({ featureId }: FeaturePageProps) {
  return (
    <div className="space-y-6">
      <FeatureContent featureId={featureId} />
    </div>
  );
}

export function FeatureSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
```

## Barrel Export Template

```ts
// components/feature/index.ts
export { FeaturePage, FeatureSkeleton } from "./feature-page";
export { FeatureContent } from "./feature-content";
```

## Jotai Atom Template

```ts
// atoms/feature/state.ts
"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const featureStateAtom = atom<FeatureState>({
  // initial state
});

// For persisted state
export const featureSettingsAtom = atomWithStorage("feature-settings", {
  // defaults
});
```

## Instructions

1. Ask what the feature/component should do
2. Determine if it needs state (Jotai atoms)
3. Generate page, loading, and component files
4. Create barrel exports
5. Add atoms if needed
