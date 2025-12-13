# Talent Tree Visualization Demo Files

Files created for comparing React Flow, D3.js, and Konva implementations.

## Delete these to remove the demo

```
apps/portal/src/app/lab/talent-flow-demo/page.tsx
apps/portal/src/components/lab/talent-flow-demo/index.ts
apps/portal/src/components/lab/talent-flow-demo/talent-flow-demo-content.tsx
apps/portal/src/components/talents-d3/index.ts
apps/portal/src/components/talents-d3/talent-d3-tree.tsx
apps/portal/src/components/talents-flow/index.ts
apps/portal/src/components/talents-flow/talent-flow-edge.tsx
apps/portal/src/components/talents-flow/talent-flow-node.tsx
apps/portal/src/components/talents-flow/talent-flow-tree.tsx
apps/portal/src/components/talents-konva/index.ts
apps/portal/src/components/talents-konva/talent-konva-tree.tsx
```

## Directories to delete

```
apps/portal/src/app/lab/talent-flow-demo/
apps/portal/src/components/lab/talent-flow-demo/
apps/portal/src/components/talents-d3/
apps/portal/src/components/talents-flow/
apps/portal/src/components/talents-konva/
```

## Quick cleanup command

```bash
rm -rf apps/portal/src/app/lab/talent-flow-demo \
       apps/portal/src/components/lab/talent-flow-demo \
       apps/portal/src/components/talents-d3 \
       apps/portal/src/components/talents-flow \
       apps/portal/src/components/talents-konva
```

## Dependencies added to apps/portal/package.json

```
@xyflow/react
d3
@types/d3
konva
react-konva
```
