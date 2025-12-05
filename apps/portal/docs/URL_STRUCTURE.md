# Portal URL Structure

## Page List

| URL | Purpose | Old URL(s) |
|-----|---------|------------|
| `/` | Home | `/` |
| `/auth/sign-in` | Authentication | `/sign-in` |
| `/simulate` | Full sim setup (character import + rotation + fight config + jobs drawer) | `/sim`, `/sim/import`, `/computing` |
| `/simulate/results/[id]` | Result view with tabs: Overview, Timeline, Charts. Compare via `?compare=[id2]` | `/sim/results`, `/timeline`, `/charts` |
| `/rotations` | Browse community rotations | `/rotations` |
| `/rotations/[id]` | View specific rotation | `/rotations/[id]` |
| `/rotations/editor` | Create new rotation (lab mode toggle inside) | `/user/rotations/create`, `/editor` |
| `/rotations/editor/[id]` | Edit existing rotation | `/editor` |
| `/optimize` | Top Gear + Drops as tabs | `/top-gear`, `/drop-optimizer` |
| `/rankings` | Leaderboards, spec filter via `?spec=` | `/dps-rankings` |
| `/account` | Profile overview + tabs: Characters, Rotations, History | `/user/profile`, `/user/history` |
| `/account/settings` | Preferences | `/user/settings` |
| `/users/[handle]` | Public profile | `/users/[handle]` |
| `/lab/data-inspector` | Spell/item lookup | `/data-inspector` |
| `/changelog` | Release notes | `/changelog` |

### Removed/Merged Pages

| Old URL | Merged Into |
|---------|-------------|
| `/sim/import` | Step inside `/simulate` |
| `/computing` | Jobs drawer (global) |
| `/timeline` | Tab on `/simulate/results/[id]?tab=timeline` |
| `/charts` | Tab on `/simulate/results/[id]?tab=charts` |
| `/user/rotations/create` | `/rotations/editor` (no ID = new) |
| `/top-gear` | `/optimize?tab=top-gear` |
| `/drop-optimizer` | `/optimize?tab=drops` |
| `/user/history` | `/account?tab=history` |
| `/workbench` | Lab mode toggle inside `/rotations/editor` |
| `/debug/simulation` | Dev only, not in main navigation |

---

## Interaction Map

### Simulation Flow

| User Action | Result |
|-------------|--------|
| Click "Quick Sim" on home | → `/simulate` |
| Paste import string | Character fills in (stays on `/simulate`) |
| Pick rotation from dropdown | Rotation selected (stays on `/simulate`) |
| Click "Run" | Job starts, jobs drawer opens, stays on `/simulate` |
| Job completes | Notification → click to go `/simulate/results/[id]` |
| Click "Timeline" tab | Tab switches (URL: `/simulate/results/[id]?tab=timeline`) |
| Click "Charts" tab | Tab switches (URL: `/simulate/results/[id]?tab=charts`) |
| Click "Compare" + pick another result | Compare mode (URL: `/simulate/results/[id]?compare=[id2]`) |
| Click "Rerun with changes" | → `/simulate` prefilled with this result's config |
| Click "Find Upgrades" | → `/optimize` with character context |

### Rotation Flow

| User Action | Result |
|-------------|--------|
| Click "Rotations" in nav | → `/rotations` |
| Click on a rotation card | → `/rotations/[id]` |
| Click "Use This" | → `/simulate` with rotation prefilled |
| Click "Edit" (if owner) | → `/rotations/editor/[id]` |
| Click "Fork" (if not owner) | → `/rotations/editor?source=[id]` (creates copy) |
| Click "Create Rotation" | → `/rotations/editor` |
| Toggle "Lab Mode" in editor | Advanced sandbox tools appear (same URL) |
| Click "Test Run" in editor | Job starts, drawer opens, stays in editor |
| Click result notification | → `/simulate/results/[id]` |
| Click "Back to Editor" on result | → `/rotations/editor/[id]` |

### Optimization Flow

| User Action | Result |
|-------------|--------|
| Click "Top Gear" on home | → `/optimize?tab=top-gear` |
| Click "Drops" tab | Tab switches (URL: `/optimize?tab=drops`) |
| Select character from dropdown | Character context set (same URL) |
| Click "Find Upgrades" | Runs internal sims, shows ranked results (same page) |
| Click upgrade item | Opens item detail modal |

### Account Flow

| User Action | Result |
|-------------|--------|
| Click avatar | → `/account` |
| Click "Characters" tab | `/account?tab=characters` |
| Click "Rotations" tab | `/account?tab=rotations` |
| Click "History" tab | `/account?tab=history` |
| Click a past sim | → `/simulate/results/[id]` |
| Click a rotation | → `/rotations/[id]` |
| Click "Settings" | → `/account/settings` |

### Rankings Flow

| User Action | Result |
|-------------|--------|
| Click "Rankings" in nav | → `/rankings` |
| Select spec filter | `/rankings?spec=frost-mage` |
| Click on a ranked sim | → `/simulate/results/[id]` |

### Global

| User Action | Result |
|-------------|--------|
| Click jobs icon (header) | Jobs drawer opens (any page) |
| Click job in drawer | → `/simulate/results/[id]` |
| Click "Data Inspector" | → `/lab/data-inspector` |
| Click "Changelog" | → `/changelog` |

---

## Data Flow

### Core Entities

```
Character ──┬──► Simulation Run ──► Result
            │         ▲
Rotation ───┴─────────┘
```

### Page Data Dependencies

| Page | Requires | Produces |
|------|----------|----------|
| `/simulate` | - | Character (temp or saved), Job |
| `/simulate/results/[id]` | Result ID | - |
| `/rotations/editor` | Auth | Rotation |
| `/rotations/editor/[id]` | Rotation ID, Auth | Rotation (updated) |
| `/optimize` | Character context | Upgrade recommendations |
| `/rankings` | - | - |
| `/account` | Auth | - |

### Context Passing

| From | To | Context Passed |
|------|-----|----------------|
| `/simulate/results/[id]` | `/optimize` | Character snapshot from result |
| `/simulate/results/[id]` | `/simulate` | Full config (rerun) |
| `/simulate/results/[id]` | `/rotations/editor/[id]` | Rotation ID |
| `/rotations/[id]` | `/simulate` | Rotation |
| `/rotations/[id]` | `/rotations/editor` | Rotation (fork via `?source=`) |
| `/account` (history tab) | `/simulate/results/[id]` | Result ID |
| `/rankings` | `/simulate/results/[id]` | Result ID |
