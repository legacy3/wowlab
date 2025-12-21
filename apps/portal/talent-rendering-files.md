# Talent Rendering Files (apps/portal)

Short list of files that implement or directly support the talent UI rendering in the Portal app.

- `apps/portal/src/app/talents/layout.tsx` — Page shell for the talent calculator route (title, description, breadcrumbs).
- `apps/portal/src/app/talents/loading.tsx` — Route-level loading state that renders the talent calculator skeleton.
- `apps/portal/src/app/talents/page.tsx` — Page entry that mounts the talent calculator content.
- `apps/portal/src/components/talents/calculator/index.ts` — Barrel exports for the talent calculator UI and helpers.
- `apps/portal/src/components/talents/calculator/talent-calculator-content.tsx` — Main calculator screen; loads trees, decodes/encodes talent strings, and renders the interactive tree.
- `apps/portal/src/components/talents/calculator/talent-calculator-skeleton.tsx` — Skeleton UI for the calculator while Suspense data is loading.
- `apps/portal/src/components/talents/calculator/talent-encoding.ts` — Helpers to create/encode talent strings and derive selections from decoded loadouts.
- `apps/portal/src/components/talents/calculator/talent-preset-picker.tsx` — Preset picker dialog with mock presets for quick loadouts.
- `apps/portal/src/components/talents/calculator/talent-start-screen.tsx` — Start screen UI for importing a string or picking a spec.
- `apps/portal/src/components/talents/calculator/talent-state-message.tsx` — Centered empty/error state messaging for the calculator.
- `apps/portal/src/components/talents/calculator/talent-string-bar.tsx` — Input bar for editing/copying/sharing the talent string.
- `apps/portal/src/components/talents/constants.ts` — Rendering constants (sizes, colors, scale limits, padding).
- `apps/portal/src/components/talents/index.ts` — Barrel exports for talent rendering components and types.
- `apps/portal/src/components/talents/talent-controls.tsx` — Toolbar for search, zoom, reset, zen mode, and export actions.
- `apps/portal/src/components/talents/talent-edge.tsx` — Konva line renderer for edges with state-based styling.
- `apps/portal/src/components/talents/talent-hover-link.tsx` — HoverCard preview renderer for encoded talent strings.
- `apps/portal/src/components/talents/talent-node.tsx` — Konva node renderer (icons, highlights, selection rings, rank badges).
- `apps/portal/src/components/talents/talent-tooltip.tsx` — Tooltip UI for talent nodes with spell descriptions.
- `apps/portal/src/components/talents/talent-tree.tsx` — Core interactive tree renderer (layout, pan/zoom, selection logic, tooltip state, export).
- `apps/portal/src/components/talents/talent-utils.ts` — Shared talent-tree logic (layout math, search, dependency traversal, point limits).
- `apps/portal/src/components/talents/types.ts` — Shared types for positions, layout, and tooltip state.
- `apps/portal/src/components/tours/definitions/index.ts` — Exports the talent import tour used by the calculator.
- `apps/portal/src/components/tours/definitions/talents-import-tour.tsx` — Guided tour steps for the talent import/start screen.
- `apps/portal/src/components/tours/index.ts` — Public tour exports used to render the talent import tour.
- `apps/portal/src/hooks/use-talent-layout.ts` — Memoized layout helper that scales/positions nodes and edges for rendering.
- `apps/portal/src/hooks/use-talent-tree.ts` — Data hook that fetches talent trees and applies decoded selections.
