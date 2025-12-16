# Navigation Architecture

Deep analysis of the sidebar navigation structure and page hierarchy.

## Current Navigation Structure

```
SIDEBAR NAVIGATION (from menu-config.ts)
├── Simulate
│   └── Simulate (/simulate)
├── Optimize
│   └── Optimize (/optimize)
├── Discover
│   ├── Rankings (/rankings)
│   └── Rotations (/rotations)
├── Create
│   └── Editor (/rotations/editor)
├── Lab
│   ├── Data Inspector (/lab/data-inspector)
│   ├── Spec Coverage (/lab/spec-coverage)
│   └── Talent Calculator (/lab/talent-calculator)
└── About
    ├── About (/about)
    ├── Changelog (/changelog)
    ├── Docs (/docs)
    └── GitHub (external)
```

## Analysis of Current Structure

### What Works

1. **Logical Grouping**: Simulate, Optimize, Discover are sensible verb-based categories
2. **Single-Item Groups**: Simulate and Optimize having one item each is clean (though could be ungrouped)
3. **About Section**: Appropriate placement at bottom for informational pages
4. **External Link Handling**: GitHub opens in new tab (correct behavior)

### What Doesn't Work

1. **Create Group Isolation**: Editor is alone in "Create" - orphaned from Rotations it relates to
2. **Lab Misuse**: Contains Talent Calculator which isn't experimental
3. **No Hub Links**: Lab has no link to `/lab` overview page
4. **Discover Scope**: Rankings and Rotations are both "discover" but serve different purposes

## Page Hierarchy vs Navigation

### Hidden Pages (Not in Navigation)

| Page            | Path                     | Why Hidden?            | Should Be Accessible? |
| --------------- | ------------------------ | ---------------------- | --------------------- |
| Landing         | `/`                      | Accessed via logo      | Correct               |
| Sim Results     | `/simulate/results/[id]` | Child of Simulate      | Correct               |
| Rotation Detail | `/rotations/[id]`        | Child of Rotations     | Correct               |
| Rotation Edit   | `/rotations/editor/[id]` | Child of Editor        | Correct               |
| Account         | `/account`               | Via navbar auth button | Consider sidebar link |
| Settings        | `/account/settings`      | Child of Account       | Correct               |
| Sign In         | `/auth/sign-in`          | Via navbar auth button | Correct               |
| User Profile    | `/users/[handle]`        | Linked from content    | Correct               |

### Orphaned Paths

These exist but have no obvious entry point:

1. `/lab` - Lab overview page exists but no nav link to it
2. `/optimize/drops` - Tab on Optimize page, not direct nav

## Proposed Navigation Restructure

### Option A: Minimal Changes

Move Talent Calculator out of Lab, nest Editor under Rotations.

```
├── Simulate
│   └── Simulate
├── Plan (NEW)
│   └── Talents (moved from Lab)
├── Optimize
│   └── Optimize
├── Discover
│   ├── Rankings
│   └── Rotations
│       ├── Browse (current /rotations)
│       └── Editor (moved from Create)
├── Lab
│   ├── Overview (new link to /lab)
│   ├── Data Inspector
│   └── Spec Coverage
└── About
    └── ...
```

**Pros**: Minimal disruption, fixes critical issues
**Cons**: "Plan" group with one item feels sparse

### Option B: Comprehensive Restructure

Flatten single-item groups, create clearer hierarchy.

```
├── Simulate (/simulate) [no group]
├── Talents (/talents) [moved, no group]
├── Optimize (/optimize) [no group]
├── Rankings (/rankings) [renamed from Discover]
├── Rotations
│   ├── Browse (/rotations)
│   ├── My Rotations (/account?tab=rotations) [new shortcut]
│   └── Create (/rotations/editor)
├── Lab
│   ├── Data Inspector
│   └── Spec Coverage
└── About
    └── ...
```

**Pros**: Cleaner, flatter structure. Clear action-oriented items.
**Cons**: More changes, My Rotations shortcut adds complexity

### Option C: User-Centric Grouping

Group by user intent, not feature type.

```
├── Play (run simulations)
│   ├── Simulate
│   └── Results (/account?tab=history)
├── Build (plan character)
│   ├── Talents
│   └── Gear (Optimize)
├── Explore (discover content)
│   ├── Rankings
│   └── Rotations
├── Create (make content)
│   ├── My Rotations
│   └── New Rotation
├── Lab
│   └── ...
└── About
    └── ...
```

**Pros**: Maps to user mental models
**Cons**: Major restructure, naming may confuse ("Play"?)

## Recommendation

**Implement Option A** as first phase:

1. Create "Plan" or "Build" group with Talent Calculator
2. Nest Editor under Rotations as "Create" or "New"
3. Add link to Lab overview
4. Keep everything else stable

Future iteration can flatten if needed.

## Landing Page Card Mapping

Current landing cards and their navigation equivalents:

| Card              | Nav Destination     | Duplicate?                            |
| ----------------- | ------------------- | ------------------------------------- |
| Recent Characters | (no nav equivalent) | Unique - contextual                   |
| Quick Sim         | /simulate           | YES - duplicate entry                 |
| Simulate          | /simulate           | Primary                               |
| Optimize          | /optimize           | Primary                               |
| Rankings          | /rankings           | Primary                               |
| Rotations         | /rotations          | Primary                               |
| Editor            | /rotations/editor   | Primary                               |
| Lab               | /lab                | Primary (but Lab overview not in nav) |

### Landing Page Simplification

Reduce to 3-4 primary cards + optional "More" section:

**Primary Cards (always visible)**:

1. **Quick Sim** - The main action, keep prominent
2. **Recent Characters** - Personalized, high value
3. **Optimize** - Second most common task

**Secondary Cards (collapsed or smaller)**: 4. Rankings 5. Rotations 6. Talents (when moved from Lab) 7. Lab

**Remove**:

- Simulate card (Quick Sim covers this)
- Editor card (access via Rotations)

## URL Structure Analysis

### Current URL Patterns

```
/                           # Landing
/simulate                   # Simulate page
/simulate/results/[id]      # Results (ID = job ID)
/optimize                   # Optimize page
/rankings                   # Rankings page
/rotations                  # Rotations browse
/rotations/[id]             # Rotation detail (UUID)
/rotations/editor           # New rotation
/rotations/editor/[id]      # Edit rotation (UUID)
/lab                        # Lab overview
/lab/data-inspector         # Data inspector
/lab/spec-coverage          # Spec coverage
/lab/talent-calculator      # Talent calculator
/account                    # Account page
/account/settings           # Settings
/users/[handle]             # User profile
/auth/sign-in               # Sign in
/auth/callback              # OAuth callback (route)
/about                      # About page
/changelog                  # Changelog
/docs                       # Docs index
/docs/[...slug]             # Doc page
```

### URL Recommendations

1. **Talent Calculator**: If moved to primary nav, consider `/talents` instead of `/lab/talent-calculator`
2. **Rotation Edit**: `/rotations/[id]/edit` might be clearer than `/rotations/editor/[id]`
3. **Results**: Consider `/simulate/[id]` instead of `/simulate/results/[id]` (cleaner)

### Suggested URL Migration

| Current                  | Proposed               | Reason           |
| ------------------------ | ---------------------- | ---------------- |
| `/lab/talent-calculator` | `/talents`             | Promoted feature |
| `/rotations/editor`      | `/rotations/new`       | Clearer intent   |
| `/rotations/editor/[id]` | `/rotations/[id]/edit` | RESTful pattern  |
| `/simulate/results/[id]` | `/simulate/[id]`       | Simpler          |

Note: These are suggestions. Implement with redirects for backward compatibility.

## Breadcrumb Patterns

Current breadcrumb usage:

| Page              | Breadcrumbs                    |
| ----------------- | ------------------------------ |
| Simulate          | Home → Simulate                |
| Results           | Home → Simulate → Results      |
| Optimize          | Home → Optimize                |
| Rankings          | Home → Rankings                |
| Rotations         | Home → Rotations               |
| Rotation Detail   | Home → Rotations → View        |
| Editor (new)      | Home → Rotations → New         |
| Editor (edit)     | Home → Rotations → Edit        |
| Lab               | Home → Lab                     |
| Data Inspector    | Home → Lab → Data Inspector    |
| Talent Calculator | Home → Lab → Talent Calculator |
| Account           | Home → Account                 |
| Settings          | Home → Account → Settings      |
| About             | About                          |
| Changelog         | Changelog                      |

### Breadcrumb Issues

1. **Rotation Detail** says "View" not rotation name - should show name
2. **Lab items** show "Lab" but Lab isn't clickable in breadcrumb (no href)
3. **About/Changelog** use self-reference, not Home first

### Breadcrumb Fixes

```tsx
// Rotation Detail - use rotation name
breadcrumbs={[
  { label: "Home", href: "/" },
  { label: "Rotations", href: "/rotations" },
  { label: rotation.name }, // Dynamic
]}

// Lab items - make Lab clickable
breadcrumbs={[
  { label: "Home", href: "/" },
  { label: "Lab", href: "/lab" }, // Add href
  { label: "Data Inspector" },
]}
```
