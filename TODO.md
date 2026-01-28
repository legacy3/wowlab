# TODO

## portal (`apps/portal`)

- [ ] Implement account overview page (`src/app/[locale]/account/page.tsx`) - currently just redirects to nodes
- [ ] Import content types from lib package instead of local definitions (`src/lib/content/types.ts`)
- [ ] Add dark theme support to mermaid diagrams (`src/components/content/md/md-mermaid.tsx`)
- [ ] Move code block styles to a Panda recipe (`src/components/content/md/md-code.tsx`)

## engine (`crates/engine`)

- [ ] Look up armor constant by target level instead of hardcoding level 80 (`src/combat/damage/pipeline.rs:127`)
- [ ] Implement `UseTrinket`/`UseItem` rotation actions (`src/rotation/compiler.rs:599-623`) - blocked on equipment system
- [ ] Wire up spell cost/cast_time/range from tuning data (`src/rotation/expr/spell.rs:48-64`) - currently all return 0.0
