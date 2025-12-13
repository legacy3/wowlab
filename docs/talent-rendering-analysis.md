# Talent Tree Rendering Analysis

> A comprehensive analysis of the current talent rendering implementation and evaluation of modern alternatives.

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [Architecture Overview](#architecture-overview)
3. [Library Alternatives](#library-alternatives)
4. [Detailed Comparisons](#detailed-comparisons)
5. [Recommendations](#recommendations)
6. [Migration Considerations](#migration-considerations)

---

## Current Implementation

### Technology Stack

| Component | Technology                          |
| --------- | ----------------------------------- |
| Framework | Next.js 16 + React                  |
| Rendering | SVG (edges) + HTML/CSS (nodes)      |
| State     | React hooks + Jotai                 |
| Styling   | Tailwind CSS                        |
| Layout    | Pre-computed positions from backend |

### File Structure

```
apps/portal/src/components/talents/
├── talent-tree.tsx          (254 lines) - Main container & orchestrator
├── talent-node.tsx          (197 lines) - Individual talent node renderer
├── talent-edge.tsx          (44 lines)  - SVG connection lines
├── talent-tree-preview.tsx  (136 lines) - Wrapper with zen mode
├── talent-utils.ts          (167 lines) - Layout & filtering utilities
└── index.ts                 (4 lines)   - Barrel export

apps/portal/src/hooks/
├── use-pan-zoom.ts          (119 lines) - Pan/zoom state management
├── use-talent-tree.ts       (34 lines)  - Data fetching & memoization
└── use-zen-mode.ts          (46 lines)  - Full-screen mode state
```

### Current Rendering Approach

#### Nodes (HTML + CSS)

- Nodes rendered as `<div>` elements with absolute positioning
- CSS transforms for pan/zoom: `transform: translate(x, y) scale(s)`
- Hover effects via CSS `:hover` and scale transforms
- GameIcon component for talent icons
- Tooltip overlays for talent details

#### Edges (SVG)

- Single SVG layer with `<line>` elements
- Three visual states based on selection:
  - **Active** (both nodes selected): Yellow `#facc15`
  - **Unlocked** (from selected): Green `#22c55e`
  - **Locked**: Gray `#4b5563`

#### Pan/Zoom Implementation

```typescript
// Current approach in use-pan-zoom.ts
const handleWheel = (e) => {
  const scale = e.deltaY < 0 ? prevScale * 1.1 : prevScale / 1.1;
  // Zoom toward pointer position
  const newX = pointerX - (pointerX - prevX) * (scale / prevScale);
};
```

### Strengths of Current Implementation

- Simple, readable code
- Good React patterns (memoization, hooks)
- Accessible HTML nodes (focusable, semantic)
- Native CSS tooltips and hover states
- Pre-computed layout from backend

### Limitations

1. **SVG Performance**: May lag with 300+ edges
2. **No Virtualization**: All nodes render regardless of viewport
3. **Manual Edge Routing**: Simple lines, no curves or smart routing
4. **Limited Animation**: No transition effects between states
5. **Touch Support**: Basic, could improve for mobile

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Database (DBC Tables)                                       │
│  ├── TalentTree, TalentNode, TalentEdge, TalentSubTree      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  transformTalentTree (Effect-TS Service)                     │
│  ├── Fetches all related data                               │
│  ├── Computes hero tree offsets                             │
│  └── Returns complete TalentTree object                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  useTalentTree Hook                                          │
│  ├── Memoized data fetching                                 │
│  └── Returns { data, isLoading, error }                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TalentTree Component                                        │
│  ├── computeTalentLayout() - Scale & offset calculation     │
│  ├── computeVisibleNodes() - BFS graph traversal            │
│  ├── filterByHeroTree() - Hero subtree filtering            │
│  └── searchTalentNodes() - Search matching                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│  TalentNode         │       │  TalentEdge         │
│  ├── Icon           │       │  ├── SVG Line       │
│  ├── Rank badge     │       │  └── Color state    │
│  └── Tooltip        │       │                     │
└─────────────────────┘       └─────────────────────┘
```

### State Management

| State            | Location          | Purpose                        |
| ---------------- | ----------------- | ------------------------------ |
| `panZoom`        | `usePanZoom` hook | `{ x, y, scale }` for viewport |
| `selectedHeroId` | Component state   | Which hero subtree is visible  |
| `searchQuery`    | Component state   | Filter nodes by name           |
| `selections`     | Decoded from URL  | Which talents are selected     |

---

## Library Alternatives

### Quick Comparison Matrix

| Library          | Rendering    | Performance | React Integration  | Bundle Size | Learning Curve |
| ---------------- | ------------ | ----------- | ------------------ | ----------- | -------------- |
| **React Flow**   | SVG/HTML     | Excellent   | Native             | ~184 kB     | Low            |
| **Konva**        | Canvas       | Excellent   | react-konva        | ~63 kB      | Medium         |
| **PixiJS**       | WebGL/WebGPU | Outstanding | pixi-react         | ~226 kB     | High           |
| **D3.js**        | SVG/Canvas   | Good        | Manual             | ~280 kB\*   | High           |
| **Cytoscape.js** | Canvas/WebGL | Excellent   | react-cytoscapejs  | ~4.2 MB     | High           |
| **Reaflow**      | SVG + ELK    | Good        | Native             | ~342 kB     | Medium         |
| **Three.js**     | WebGL        | Outstanding | @react-three/fiber | ~609 kB     | Very High      |

\*D3 with submodule selection can be much smaller

---

## Detailed Comparisons

### 1. React Flow (xyflow) - **RECOMMENDED**

**Best for**: Node-based UIs with built-in features

```tsx
import { ReactFlow, useNodesState, useEdgesState } from "@xyflow/react";

const TalentTree = ({ talents }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    talents.nodes.map((n) => ({
      id: n.id.toString(),
      type: "talentNode",
      position: { x: n.posX, y: n.posY },
      data: { talent: n, isSelected: false },
    })),
  );

  const [edges, setEdges] = useEdgesState(
    talents.edges.map((e) => ({
      id: e.id.toString(),
      source: e.fromNodeId.toString(),
      target: e.toNodeId.toString(),
      type: "talentEdge",
    })),
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={{ talentNode: TalentNodeComponent }}
      edgeTypes={{ talentEdge: TalentEdgeComponent }}
      fitView
      panOnDrag
      zoomOnScroll
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
```

**Pros**:

- Built-in pan/zoom, minimap, controls
- Custom node/edge components
- Excellent TypeScript support
- Active development, good docs
- Selective re-rendering for performance
- Touch/mobile support improved recently

**Cons**:

- Larger bundle than current implementation
- Learning React Flow patterns
- Some styling constraints

**Migration Effort**: Medium (2-3 days)

---

### 2. Konva / React-Konva

**Best for**: Canvas-based rendering with React

```tsx
import { Stage, Layer, Circle, Line, Group } from "react-konva";

const TalentTree = ({ talents, panZoom }) => (
  <Stage
    width={800}
    height={600}
    draggable
    scaleX={panZoom.scale}
    scaleY={panZoom.scale}
  >
    <Layer>
      {/* Edges first (behind nodes) */}
      {talents.edges.map((edge) => (
        <Line
          key={edge.id}
          points={[
            talents.nodeMap[edge.fromNodeId].posX,
            talents.nodeMap[edge.fromNodeId].posY,
            talents.nodeMap[edge.toNodeId].posX,
            talents.nodeMap[edge.toNodeId].posY,
          ]}
          stroke={edge.isActive ? "#facc15" : "#4b5563"}
          strokeWidth={2}
        />
      ))}

      {/* Nodes */}
      {talents.nodes.map((node) => (
        <Group key={node.id} x={node.posX} y={node.posY}>
          <Circle
            radius={20}
            fill={node.isSelected ? "#22c55e" : "#1f2937"}
            stroke={node.isSelected ? "#facc15" : "#374151"}
            strokeWidth={2}
            onMouseEnter={(e) => e.target.scale({ x: 1.1, y: 1.1 })}
            onMouseLeave={(e) => e.target.scale({ x: 1, y: 1 })}
            onClick={() => handleNodeClick(node.id)}
          />
          {/* Icon would be rendered via Konva.Image */}
        </Group>
      ))}
    </Layer>
  </Stage>
);
```

**Pros**:

- True canvas rendering (better for many nodes)
- Excellent animation support
- Hit detection built-in
- Smaller bundle than React Flow
- Good caching/performance features

**Cons**:

- No built-in graph features (edges, routing)
- Need to implement tooltips manually (HTML overlay)
- Accessibility harder (canvas not semantic)
- Image loading for icons needs management

**Migration Effort**: Medium-High (3-4 days)

---

### 3. PixiJS / @pixi/react

**Best for**: GPU-accelerated rendering, game-like UIs

```tsx
import { Stage } from "@pixi/react";
import { Graphics, Container, Sprite } from "pixi.js";

const TalentTree = ({ talents }) => {
  const drawEdges = useCallback(
    (g: Graphics) => {
      g.clear();
      talents.edges.forEach((edge) => {
        const from = talents.nodeMap[edge.fromNodeId];
        const to = talents.nodeMap[edge.toNodeId];
        g.setStrokeStyle({
          color: edge.isActive ? 0xfacc15 : 0x4b5563,
          width: 2,
        });
        g.moveTo(from.posX, from.posY);
        g.lineTo(to.posX, to.posY);
        g.stroke();
      });
    },
    [talents],
  );

  return (
    <Stage width={800} height={600} options={{ backgroundAlpha: 0 }}>
      <pixiGraphics draw={drawEdges} />
      {talents.nodes.map((node) => (
        <pixiContainer key={node.id} x={node.posX} y={node.posY}>
          <pixiSprite
            texture={iconTextures[node.iconId]}
            anchor={0.5}
            eventMode="static"
            cursor="pointer"
            onPointerOver={(e) => e.currentTarget.scale.set(1.1)}
            onPointerOut={(e) => e.currentTarget.scale.set(1)}
            onClick={() => handleNodeClick(node.id)}
          />
        </pixiContainer>
      ))}
    </Stage>
  );
};
```

**Pros**:

- WebGL/WebGPU rendering (extremely fast)
- Handles thousands of sprites easily
- Built-in sprite batching
- Great for animations/effects
- Game-engine quality rendering

**Cons**:

- Highest learning curve
- Accessibility is DIY
- Tooltips need HTML overlay
- Asset loading pipeline required
- Overkill for ~100 nodes

**Migration Effort**: High (4-5 days)

---

### 4. D3.js

**Best for**: Custom visualizations, data-driven graphics

```tsx
import * as d3 from "d3";

const TalentTree = ({ talents, containerRef }) => {
  useEffect(() => {
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", 800)
      .attr("height", 600);

    // Edges
    svg
      .selectAll("line.edge")
      .data(talents.edges)
      .enter()
      .append("line")
      .attr("x1", (d) => talents.nodeMap[d.fromNodeId].posX)
      .attr("y1", (d) => talents.nodeMap[d.fromNodeId].posY)
      .attr("x2", (d) => talents.nodeMap[d.toNodeId].posX)
      .attr("y2", (d) => talents.nodeMap[d.toNodeId].posY)
      .attr("stroke", (d) => (d.isActive ? "#facc15" : "#4b5563"));

    // Nodes
    const nodeGroups = svg
      .selectAll("g.node")
      .data(talents.nodes)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.posX}, ${d.posY})`);

    nodeGroups
      .append("circle")
      .attr("r", 20)
      .attr("fill", (d) => (d.isSelected ? "#22c55e" : "#1f2937"));

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.selectAll("g, line").attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [talents]);

  return <div ref={containerRef} />;
};
```

**Pros**:

- Ultimate flexibility
- Excellent for custom visualizations
- Force-directed layouts available
- Great animations with transitions
- Well-documented, huge community

**Cons**:

- Imperative API conflicts with React
- Steep learning curve
- Manual everything (zoom, pan, events)
- DOM manipulation outside React

**Migration Effort**: High (4-5 days)

---

### 5. Cytoscape.js

**Best for**: Graph-theory applications, network visualizations

```tsx
import CytoscapeComponent from "react-cytoscapejs";

const TalentTree = ({ talents }) => {
  const elements = useMemo(
    () => [
      ...talents.nodes.map((n) => ({
        data: { id: n.id.toString(), label: n.name, ...n },
        position: { x: n.posX, y: n.posY },
      })),
      ...talents.edges.map((e) => ({
        data: {
          source: e.fromNodeId.toString(),
          target: e.toNodeId.toString(),
          id: e.id.toString(),
        },
      })),
    ],
    [talents],
  );

  const stylesheet = [
    {
      selector: "node",
      style: {
        "background-color": "#1f2937",
        "border-width": 2,
        "border-color": "#374151",
        width: 40,
        height: 40,
      },
    },
    {
      selector: "node[?isSelected]",
      style: {
        "background-color": "#22c55e",
        "border-color": "#facc15",
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": "#4b5563",
        width: 2,
      },
    },
  ];

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: "100%", height: "600px" }}
      stylesheet={stylesheet}
      userZoomingEnabled
      userPanningEnabled
    />
  );
};
```

**Pros**:

- Rich graph-theory features (layouts, algorithms)
- Built-in styling via stylesheet
- Compound nodes support
- Animation and transition support
- Pan/zoom out of the box

**Cons**:

- Very large bundle (4+ MB)
- Overkill for static layouts
- Less React-native feel
- Custom rendering limited

**Migration Effort**: Medium (2-3 days)

---

### 6. Reaflow

**Best for**: Workflow diagrams with auto-layout

```tsx
import { Canvas, Node, Edge, MarkerArrow } from "reaflow";

const TalentTree = ({ talents }) => {
  const nodes = talents.nodes.map((n) => ({
    id: n.id.toString(),
    text: n.name,
    data: n,
  }));

  const edges = talents.edges.map((e) => ({
    id: e.id.toString(),
    from: e.fromNodeId.toString(),
    to: e.toNodeId.toString(),
  }));

  return (
    <Canvas
      nodes={nodes}
      edges={edges}
      node={<Node style={{ fill: "#1f2937" }} />}
      edge={<Edge style={{ stroke: "#4b5563" }} />}
      arrow={<MarkerArrow />}
      fit
      zoomable
      pannable
    />
  );
};
```

**Pros**:

- ELK-powered auto-layout
- Built-in virtualization
- React-native components
- Zoom/pan included
- Good for workflows

**Cons**:

- Layout engine CPU-heavy
- Less control over positioning
- Touch support incomplete
- Smaller community

**Migration Effort**: Medium (2-3 days)

---

## Recommendations

### Primary Recommendation: React Flow

**Why React Flow?**

1. **Best React Integration**: Native hooks, TypeScript, controlled/uncontrolled modes
2. **Feature-Complete**: Pan/zoom, minimap, controls, edge routing all included
3. **Performance**: Selective re-rendering handles 100-300 nodes easily
4. **Active Development**: Regular updates, good documentation
5. **Low Migration Effort**: Similar mental model to current implementation
6. **Production Ready**: Used by major companies (Stripe, etc.)

### Alternative Recommendations

| Scenario                  | Recommendation | Reason                                   |
| ------------------------- | -------------- | ---------------------------------------- |
| Need 500+ nodes           | PixiJS         | WebGL batching handles massive datasets  |
| Custom effects/animations | Konva          | Better animation primitives than SVG     |
| Graph algorithms needed   | Cytoscape.js   | Built-in shortest path, clustering, etc. |
| Auto-layout required      | Reaflow        | ELK engine handles complex layouts       |
| Full custom control       | D3.js          | When you need complete flexibility       |

---

## Migration Considerations

### React Flow Migration Path

#### Phase 1: Setup (Day 1)

```bash
pnpm add @xyflow/react
```

Create new components:

- `talent-tree-flow.tsx` - New main component
- `talent-node-flow.tsx` - Custom node type
- `talent-edge-flow.tsx` - Custom edge type

#### Phase 2: Data Transformation (Day 1)

```typescript
// Transform existing data to React Flow format
const toReactFlowNodes = (talents: TalentTree): Node[] =>
  talents.nodes.map(n => ({
    id: n.id.toString(),
    type: 'talent',
    position: { x: n.posX, y: n.posY },
    data: {
      talent: n,
      isSelected: selections.has(n.id),
      isSearchMatch: searchMatches.has(n.id),
    },
  }));

const toReactFlowEdges = (talents: TalentTree): Edge[] =>
  talents.edges.map(e => ({
    id: e.id.toString(),
    source: e.fromNodeId.toString(),
    target: e.toNodeId.toString(),
    type: 'talent',
    data: { isActive: /* compute */ },
  }));
```

#### Phase 3: Custom Components (Day 2)

```tsx
// Custom Node Component
const TalentNodeComponent = ({ data, selected }: NodeProps) => {
  const talent = data.talent;
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full border-2",
        data.isSelected
          ? "border-yellow-400 bg-green-600"
          : "border-gray-600 bg-gray-800",
      )}
    >
      <GameIcon iconId={talent.entries[0].iconFileId} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

#### Phase 4: Feature Parity (Day 2-3)

- Hero tree selector
- Search functionality
- Zen mode
- Tooltip integration

#### Phase 5: Testing & Polish (Day 3)

- Performance testing
- Mobile/touch testing
- Accessibility audit

### Estimated Effort

| Task                  | Time                     |
| --------------------- | ------------------------ |
| React Flow setup      | 2 hours                  |
| Data transformation   | 2 hours                  |
| Custom node component | 3 hours                  |
| Custom edge component | 2 hours                  |
| Pan/zoom/controls     | 1 hour (built-in)        |
| Hero tree selector    | 2 hours                  |
| Search functionality  | 2 hours                  |
| Tooltips              | 2 hours                  |
| Testing & polish      | 4 hours                  |
| **Total**             | **~20 hours (2-3 days)** |

---

## Conclusion

The current implementation is functional but has limitations in performance and features. **React Flow** offers the best balance of:

- Modern React patterns
- Built-in features (pan/zoom, minimap)
- Performance for typical talent tree sizes
- Reasonable migration effort
- Long-term maintainability

For more demanding scenarios (1000+ nodes, complex animations), consider **PixiJS** or **Konva** as canvas-based alternatives.

---

## Appendix: Bundle Size Analysis

```
Current Implementation:
├── SVG rendering: 0 kB (native)
├── use-pan-zoom.ts: ~2 kB
└── Total custom code: ~15 kB

React Flow:
├── @xyflow/react: ~184 kB
└── Total: ~184 kB (+169 kB)

Konva:
├── konva: ~150 kB
├── react-konva: ~63 kB
└── Total: ~213 kB (+198 kB)

PixiJS:
├── pixi.js: ~226 kB
├── @pixi/react: ~15 kB
└── Total: ~241 kB (+226 kB)
```

All options are acceptable for a modern web application with code splitting.
