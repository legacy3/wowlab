# Phase 4 — Split `TalentTree` into Controller + Renderer

## Goal
Make rendering pure and stateful logic explicit.

## Current State
`talent-tree.tsx` (788 lines) handles everything:
- Selection state management
- Pan/zoom state
- Tooltip/hover state
- Search state
- Paint mode (drag-select)
- Export triggers
- Konva rendering

**Already separate files (keep as-is):**
- `talent-node.tsx` — Konva node renderer
- `talent-edge.tsx` — Konva edge renderer
- `talent-tooltip.tsx` — tooltip UI
- `talent-controls.tsx` — toolbar UI

## Changes

### Split `talent-tree.tsx` into two files:

**1. `talent-tree-controller.tsx`**
Owns all stateful logic:
```ts
interface TalentTreeControllerProps {
  tree: TalentTree;
  initialSelections?: Map<number, DecodedTalentSelection>;
  initialSelectionsKey?: string | number | null;
  onSelectionsChange?: (selections: Map<number, DecodedTalentSelection>) => void;
  width?: number;
  height?: number;
}

// State owned by controller:
// - selections: Map<number, DecodedTalentSelection>
// - selectedHeroId: number | null
// - panZoom: { x, y, scale }
// - tooltip: TooltipState | null
// - hoveredNodeId: number | null
// - searchQuery: string
// - paint mode refs

// Callbacks provided to renderer:
// - onNodeClick, onNodeHoverChange
// - onPaintStart, onPaintEnter
// - onTooltipChange
// - onWheel, onMouseDown, onMouseMove, onMouseUp
// - onTouchStart, onTouchMove, onTouchEnd
```

**2. `talent-tree-renderer.tsx`**
Pure rendering, no useState for data:
```ts
interface TalentTreeRendererProps {
  viewModel: TalentViewModel;
  panZoom: { x: number; y: number; scale: number };
  tooltip: TooltipState | null;
  searchMatches: Set<number>;
  isSearching: boolean;
  pathHighlight: {
    nodeIds: Set<number>;
    edgeIds: Set<number>;
    targetNodeId: number | null;
  };

  // Event handlers (passed down to nodes/edges)
  onNodeClick: (nodeId: number) => void;
  onNodeHoverChange: (nodeId: number | null) => void;
  onPaintStart: (nodeId: number) => void;
  onPaintEnter: (nodeId: number) => void;
  onTooltipChange: (state: TooltipState | null) => void;

  // Canvas handlers
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEnd: () => void;

  // Refs for export
  stageRef: React.RefObject<Konva.Stage>;
  containerRef: React.RefObject<HTMLDivElement>;
}
```

## File Structure
Keep existing structure, just split the main file:
```
apps/portal/src/components/talents/
  talent-tree-controller.tsx   ← NEW (from talent-tree.tsx)
  talent-tree-renderer.tsx     ← NEW (from talent-tree.tsx)
  talent-tree.tsx              ← becomes thin wrapper or delete
  talent-node.tsx              ← unchanged
  talent-edge.tsx              ← unchanged
  talent-tooltip.tsx           ← unchanged
  talent-controls.tsx          ← unchanged
  talent-utils.ts              ← reduced to searchTalentNodes only
  types.ts                     ← unchanged
  constants.ts                 ← unchanged
```

**Alternative:** Move to subfolder if preferred:
```
apps/portal/src/components/talents/tree/
  controller.tsx
  renderer.tsx
  index.tsx  ← re-exports TalentTree
```

## Memoized Layers (keep pattern)
The existing `EdgesLayer` and `NodesLayer` memo wrappers are good — keep them in the renderer.

## Exit Criteria
- [ ] `TalentTreeController` owns all `useState` calls for data state
- [ ] `TalentTreeRenderer` has no `useState` except DOM-related refs
- [ ] Renderer receives `TalentViewModel` (from Phase 3)
- [ ] Controller computes path highlights, search matches, and passes them down
- [ ] Existing `EdgesLayer` and `NodesLayer` memo patterns preserved
- [ ] `talent-node.tsx`, `talent-edge.tsx`, etc. unchanged
