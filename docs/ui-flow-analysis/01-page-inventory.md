# Page Inventory

Complete inventory of all pages in the WoW Lab portal application.

## Primary Pages

### Landing Page (/)

**Purpose**: Entry point and dashboard for the application

**Location**: `apps/portal/src/app/page.tsx`

**Components**:

- `LandingContent` - Draggable dashboard with 8 cards
- Cards: Recent Characters, Quick Sim, Simulate, Optimize, Rankings, Rotations, Editor, Lab

**Layout**: Custom (NOT using PageLayout)

- Container: `max-w-5xl` (inconsistent with other pages using `max-w-7xl`)
- Manual header with h1 title

**Issues**:

- Too many entry points (8 cards)
- Duplicative options (Simulate + Quick Sim, Rotations + Editor)
- Different layout pattern than other pages

---

### Simulate (/simulate)

**Purpose**: Run DPS simulations by importing character data

**Location**: `apps/portal/src/app/simulate/page.tsx`

**Components**:

- `QuickSimContent` - Two-state component:
  - **Zen State**: Large textarea for SimC paste, recent character chips
  - **Loaded State**: Character preview, equipment grid, fight profile picker, run button

**User Flow**:

1. User pastes SimC export
2. Character data parses and displays
3. User selects fight profile
4. User clicks "Run Simulation"
5. Results display inline with link to full results

**Issues**:

- Results displayed inline with no prominent next-step CTAs
- No connection to Rotations or Optimization after completing sim

---

### Simulation Results (/simulate/results/[id])

**Purpose**: Display detailed simulation results

**Location**: `apps/portal/src/app/simulate/results/[id]/page.tsx`

**Components**:

- `SimulationResultTabs` with tabs:
  - Overview
  - Timeline (default)
  - Charts
  - Event Log

**Issues**:

- Default tab is "Timeline" but most users want "Overview" first
- No CTAs to "Try different rotation" or "Optimize gear"
- Dead-end page with no forward progression

---

### Optimize (/optimize)

**Purpose**: Find optimal gear upgrades

**Location**: `apps/portal/src/app/optimize/page.tsx`

**Components**:

- `OptimizeTabs`:
  - **Top Gear**: Draggable dashboard (Current Gear, Optimization Status, Upgrade Path)
  - **Drops**: Drop optimizer content

**Issues**:

- Requires character data but no clear path from Simulate
- "Most Wanted Items" in Rankings overlaps with this functionality

---

### Rankings (/rankings)

**Purpose**: Explore community rankings and data

**Location**: `apps/portal/src/app/rankings/page.tsx`

**Components**:

- `DpsRankings` with tabs:
  - Spec Rankings (default)
  - Top Talents
  - Most Wanted Items
  - Top Sims

**Issues**:

- "Most Wanted Items" conceptually belongs in Optimize, not Rankings
- "Top Sims" could link to rotation discovery but doesn't

---

### Rotations Browser (/rotations)

**Purpose**: Browse community-created rotation scripts

**Location**: `apps/portal/src/app/rotations/page.tsx`

**Components**:

- `RotationsBrowse` - Search, filters, and rotation list grouped by class

**Issues**:

- No connection from here to "try this rotation" workflow
- "New Rotation" button goes to Editor (good)

---

### Rotation Detail (/rotations/[id])

**Purpose**: View a specific rotation's details

**Location**: `apps/portal/src/app/rotations/[id]/page.tsx`

**Components**:

- `RotationDetail` - Full rotation info, script preview, fork history

**Issues**:

- Not linked from landing page
- No "Test this rotation" CTA to run a simulation with it
- Fork button works but experience is disconnected

---

### Rotation Editor (/rotations/editor)

**Purpose**: Create new rotation scripts

**Location**: `apps/portal/src/app/rotations/editor/page.tsx`

**Components**:

- `RotationEditor` with states:
  - **Not Authenticated**: Sign-in prompt
  - **New/Fork Mode**: Metadata setup form
  - **Draft/Edit Mode**: Full editor view with sidebar

**Issues**:

- Advanced feature prominently placed in primary navigation
- Requires authentication (good gate, but messaging could be clearer upfront)

---

### Rotation Editor Edit (/rotations/editor/[id])

**Purpose**: Edit existing rotation

**Location**: `apps/portal/src/app/rotations/editor/[id]/page.tsx`

**Components**:

- Same as `/rotations/editor` but in edit mode

---

## Lab Pages

### Lab Hub (/lab)

**Purpose**: Hub for experimental tools

**Location**: `apps/portal/src/app/lab/page.tsx`

**Components**:

- `LabContent` - Draggable dashboard with 3 cards:
  - Data Inspector
  - Spec Coverage
  - Talent Calculator

**Issues**:

- Talent Calculator is NOT experimental - it's a standard WoW tool
- Should be promoted to primary navigation

---

### Data Inspector (/lab/data-inspector)

**Purpose**: Query and inspect spell/item data

**Location**: `apps/portal/src/app/lab/data-inspector/page.tsx`

**Components**:

- `DataInspectorContent` - Draggable dashboard:
  - Controls card (query input)
  - History card
  - Transformed data card

**Issues**:

- Correctly placed as experimental/developer tool
- Good candidate for Lab section

---

### Spec Coverage (/lab/spec-coverage)

**Purpose**: Track implementation status across specs

**Location**: `apps/portal/src/app/lab/spec-coverage/page.tsx`

**Components**:

- `SpecCoverageContent` - Coverage matrix visualization

**Issues**:

- Good candidate for Lab (developer-focused)
- Could link to roadmap/changelog

---

### Talent Calculator (/lab/talent-calculator)

**Purpose**: View and share talent builds

**Location**: `apps/portal/src/app/lab/talent-calculator/page.tsx`

**Components**:

- `TalentCalculatorContent`:
  - Start screen (spec selection or paste string)
  - Interactive talent tree
  - Talent string input/output bar

**Issues**:

- **MAJOR**: This is NOT experimental - every WoW player uses talent calculators
- Should be in primary navigation between Simulate and Optimize
- Currently hidden in Lab makes it hard to discover

---

## Account Pages

### Account (/account)

**Purpose**: User profile and dashboard

**Location**: `apps/portal/src/app/account/page.tsx`

**Components**:

- `AccountTabs`:
  - Rotations (shows user's rotations)
  - Characters (stub - "No characters saved")
  - History (mock data only)

**Issues**:

- Characters tab has no real implementation
- History tab uses hardcoded mock data
- Both should be hidden or marked "Coming Soon"

---

### Settings (/account/settings)

**Purpose**: Account settings and preferences

**Location**: `apps/portal/src/app/account/settings/page.tsx`

**Components**:

- `SettingsOverview` - Profile and simulation settings cards

**Issues**:

- None significant - appropriately scoped

---

## Auth Pages

### Sign In (/auth/sign-in)

**Purpose**: Authentication page

**Location**: `apps/portal/src/app/auth/sign-in/page.tsx`

**Components**:

- `SignIn` - OAuth sign-in form

**Issues**:

- **Does NOT use PageLayout** - breaks design consistency
- Centered card layout differs from rest of app
- No breadcrumbs or navigation context

---

## Informational Pages

### About (/about)

**Purpose**: About page with legal content

**Location**: `apps/portal/src/app/about/page.tsx`

**Components**:

- `UrlTabs` with tabs:
  - Overview (markdown)
  - Terms of Service (markdown)
  - Privacy Policy (markdown)

**Issues**:

- None - appropriate design

---

### Changelog (/changelog)

**Purpose**: Version history and updates

**Location**: `apps/portal/src/app/changelog/page.tsx`

**Components**:

- `Changelog` - Timeline-style version history

**Issues**:

- None - appropriate design

---

### Docs (/docs)

**Purpose**: Technical documentation

**Location**: `apps/portal/src/app/docs/page.tsx`

**Components**:

- `DocTree` - Documentation tree navigation

**Issues**:

- Shows "No documentation yet" if empty (appropriate fallback)

---

### Docs Article (/docs/[...slug])

**Purpose**: Individual documentation page

**Location**: `apps/portal/src/app/docs/[...slug]/page.tsx`

---

## User Profile Pages

### User Profile (/users/[handle])

**Purpose**: Public user profile

**Location**: `apps/portal/src/app/users/[handle]/page.tsx`

**Components**:

- `NamespacePage` - User's public rotations

**Issues**:

- Limited functionality - only shows rotations
- No user bio or additional context
