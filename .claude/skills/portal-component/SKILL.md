---
name: portal-component
description: Generate Next.js components for the portal app with proper patterns. Use when creating new pages, components, or features in apps/portal.
---

# Portal Component Generator

Generate Next.js 16 components following portal conventions.

## Page Structure

For a new feature at `/app/[locale]/feature/page.tsx`:

```
app/[locale]/feature/
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
// app/[locale]/feature/page.tsx
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
// app/[locale]/feature/loading.tsx
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
import { Stack, VStack } from "styled-system/jsx";

interface FeaturePageProps {
  featureId: string;
}

export function FeaturePage({ featureId }: FeaturePageProps) {
  return (
    <VStack gap="6" alignItems="stretch">
      <FeatureContent featureId={featureId} />
    </VStack>
  );
}

export function FeatureSkeleton() {
  return (
    <VStack gap="6" alignItems="stretch">
      <Skeleton variant="rounded" height="32" />
      <Stack direction={{ base: "column", md: "row" }} gap="4">
        <Skeleton variant="rounded" height="64" flex="1" />
        <Skeleton variant="rounded" height="64" flex="1" />
      </Stack>
    </VStack>
  );
}
```

## Barrel Export Template

```ts
// components/feature/index.ts
/* eslint-disable */

// Components

export { FeaturePage, FeatureSkeleton } from "./feature-page";
export { FeatureContent } from "./feature-content";
```

## Zustand Store Template

For client-only state (selection, UI preferences, editor state):

```ts
// lib/state/feature/store.ts
"use client";

import { create } from "zustand";

interface FeatureStore {
  selectedId: string | null;
  setSelected: (id: string | null) => void;
}

export const useFeatureStore = create<FeatureStore>()((set) => ({
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}));
```

## React Query Template

For server data (fetching, mutations):

```ts
// lib/state/feature/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type FeatureRow = Tables<"features">;

export function useFeature(id: string | undefined) {
  return useQuery({
    queryKey: ["features", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
```

## Formatting Utilities

Always use `@/lib/format` for consistent formatting:

```tsx
import {
  formatInt,
  formatRelativeToNow,
  formatPercent,
  formatDurationMs,
} from "@/lib/format";

formatInt(1234567);          // "1,234,567"
formatCompact(1234567);      // "1.2M"
formatPercent(85.5);         // "85.5%"
formatRelativeToNow(date);   // "2 hours ago"
formatDurationMs(5000);      // "5 seconds"
```

## Styling

Use Panda CSS — not Tailwind classes:

```tsx
// Layout components from styled-system/jsx
import { Stack, VStack, HStack, Box, Flex } from "styled-system/jsx";

// css() for inline styles
import { css } from "styled-system/css";

<div className={css({ padding: "4", borderRadius: "md" })}>
  <HStack gap="2">
    <span className={css({ fontWeight: "bold" })}>Label</span>
  </HStack>
</div>
```

## Instructions

1. Ask what the feature/component should do
2. Determine if it needs server state (React Query) or client state (Zustand)
3. Generate page, loading, and component files
4. Create barrel exports
5. Add query/store hooks in `lib/state/{domain}/` as needed
6. Use formatting utilities for numbers, dates, durations
7. Use Panda CSS for styling, layout components for structure
