---
name: exports
description: Export patterns and barrel file conventions. Use when creating/modifying index.ts files or organizing module exports.
---

# Exports & Barrel Files

Standards for module exports and barrel files in the portal app.

## Core Principle

**Named exports only. No wildcards. No default exports in barrels.**

Turbopack and modern bundlers handle named exports better for tree-shaking. Wildcard `export *` forces bundlers to include everything and breaks cache invalidation.

## Barrel File Structure

Every barrel file follows this structure:

```ts
/* eslint-disable */

// Section Name

export { Thing, type ThingProps } from "./thing";
export { Other } from "./other";

// Another Section

export { More } from "./more";
```

### Rules

1. **ESLint disable at top** - Barrel files intentionally re-export
2. **Section comments** - Group related exports with `// Section Name`
3. **Alphabetical within sections** - Sort exports alphabetically within each group
4. **Types with values** - Export types alongside their values: `export { Foo, type FooProps }`
5. **One line per file** - Each source file gets one export line

## Section Naming

Use these section names consistently:

| Section | Contents |
|---------|----------|
| `Components` | React components |
| `Hooks` | Custom React hooks |
| `Types` | Type-only exports |
| `Constants` | Const values, enums, config |
| `Utilities` | Pure functions |
| `Context` | React context providers/consumers |
| `Mutations` | Data mutation hooks (React Query) |
| `Queries` | Data fetching hooks (React Query) |
| `Store` | Zustand/state stores |

## Examples

### Component Barrel

```ts
/* eslint-disable */

// Components

export { ActionCard, type ActionCardProps } from "./action-card";
export { ActionList } from "./action-list";
export { ActionPicker } from "./action-picker";

// Hooks

export { useActionDrag } from "./use-action-drag";
```

### State/Domain Barrel

```ts
/* eslint-disable */

// Queries

export { useNodes, useNode } from "./queries";

// Mutations

export { useClaimNode, useReleaseNode } from "./mutations";

// Store

export { useNodesSelection } from "./store";

// Types

export type { NodeStatus, NodeConfig } from "./types";
```

### UI Library Barrel

For compound components (Dialog, Menu, etc.), export the namespace:

```ts
/* eslint-disable */

// Simple Components

export { Button, type ButtonProps } from "./button";
export { Badge, type BadgeProps } from "./badge";
export { Input, type InputProps } from "./input";

// Compound Components

export { Accordion } from "./accordion";
export { Alert } from "./alert";
export { Dialog } from "./dialog";
export { Menu } from "./menu";

// Layout

export { AbsoluteCenter } from "./absolute-center";
export { Group } from "./group";
export { Stack } from "./stack";
```

## What NOT to Do

### No Wildcards

```ts
// WRONG
export * from "./button";
export * from "./card";

// RIGHT
export { Button, type ButtonProps } from "./button";
export { Card, type CardProps } from "./card";
```

### No Default Exports in Barrels

```ts
// WRONG
export { default as Button } from "./button";

// RIGHT - source file should use named export
export { Button } from "./button";
```

### No Aliasing (Unless Necessary)

```ts
// WRONG - unnecessary alias
export { Button as ButtonComponent } from "./button";

// RIGHT
export { Button } from "./button";

// OK - resolving actual name conflict
export { ActionList as ActionListComponent } from "./action-list";
```

### No Mixed Concerns

```ts
// WRONG - implementations don't belong in barrel
export { Button } from "./button";
export const DEFAULT_SIZE = "md"; // NO - this belongs in a constants file

// RIGHT - barrel only re-exports
export { Button } from "./button";
export { DEFAULT_SIZE } from "./constants";
```

## When to Create a Barrel

Always. Every directory with exportable code gets an `index.ts`.

## Index Files Are ONLY Barrels

An `index.ts` file must ONLY contain re-exports. No implementations.

If you find an `index.ts` with actual code (functions, constants, types defined inline), **split it up**:
1. Move implementations to separate files (e.g., `utils.ts`, `types.ts`, `constants.ts`)
2. Make `index.ts` a pure barrel that re-exports from those files

```ts
// WRONG - index.ts with implementation
export const FOO = "bar";
export function doThing() { ... }
export interface MyType { ... }

// RIGHT - index.ts as pure barrel
export { FOO } from "./constants";
export { doThing } from "./utils";
export type { MyType } from "./types";
```

## Import Conventions

When importing from barrels:

```ts
// GOOD - import from barrel
import { Button, Card, Dialog } from "@/components/ui";
import { useNodes, useClaimNode } from "@/lib/state";

// AVOID - bypassing barrel for public exports
import { Button } from "@/components/ui/button";

// OK - importing internal/non-exported utilities
import { internalHelper } from "@/components/ui/button/helpers";
```

## Instructions

When creating or modifying barrel files:

1. Add `/* eslint-disable */` at top
2. Group exports into logical sections with `// Section Name`
3. Use named exports only - no `export *`
4. Sort exports alphabetically within sections
5. Include types with their values on same line
6. One export statement per source file
