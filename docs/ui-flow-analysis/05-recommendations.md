# Recommendations

Prioritized list of fixes with implementation notes.

## Core Principle

**COMPONENT PATH = URL PATH**

- URL `/talents` → components in `components/talents/`
- URL `/lab/data-inspector` → components in `components/lab/data-inspector/`
- URL `/rotations/editor` → components in `components/rotations/editor/`

No redirects. No obsolete files. Delete old locations entirely.

---

## Priority 1: Critical (Do First)

### R1.1: Move Talent Calculator to `/talents`

**Violation**: IA-001
**Effort**: Medium
**Impact**: High

**Files to MOVE** (from `components/lab/talent-calculator/` → `components/talents/`):

| From | To |
|------|-----|
| `components/lab/talent-calculator/talent-calculator-content.tsx` | `components/talents/talent-calculator-content.tsx` |
| `components/lab/talent-calculator/talent-calculator-skeleton.tsx` | `components/talents/talent-calculator-skeleton.tsx` |
| `components/lab/talent-calculator/talent-start-screen.tsx` | `components/talents/talent-start-screen.tsx` |
| `components/lab/talent-calculator/talent-state-message.tsx` | `components/talents/talent-state-message.tsx` |
| `components/lab/talent-calculator/talent-string-bar.tsx` | `components/talents/talent-string-bar.tsx` |
| `components/lab/talent-calculator/talent-encoding.ts` | `components/talents/talent-encoding.ts` |

**Files to CREATE**:

| File | Content |
|------|---------|
| `app/talents/page.tsx` | New page importing from `@/components/talents` |
| `app/talents/loading.tsx` | Skeleton using `TalentCalculatorSkeleton` |

**Files to DELETE**:

| File | Reason |
|------|--------|
| `app/lab/talent-calculator/page.tsx` | Route moved to `/talents` |
| `app/lab/talent-calculator/loading.tsx` | Route moved to `/talents` |
| `components/lab/talent-calculator/` (entire folder) | Components moved to `components/talents/` |
| `components/lab/overview/cards/talent-calculator-card.tsx` | No longer in Lab |

**Files to UPDATE**:

| File | Change |
|------|--------|
| `components/talents/index.ts` | Add exports for moved components |
| `components/talents/talent-hover-link.tsx:257` | Change `/lab/talent-calculator` → `/talents` |
| `components/lab/overview/cards/index.ts` | Remove `talent-calculator-card` export |
| `components/lab/overview/lab-content.tsx` | Remove `TalentCalculatorCard` usage |
| `lib/menu-config.ts` | Move Talent Calculator to new "Talents" group, remove from Lab |

**New page implementation**:

```tsx
// app/talents/page.tsx
import { PageLayout } from "@/components/page";
import { TalentCalculatorContent } from "@/components/talents";

export default function TalentsPage() {
  return (
    <PageLayout
      title="Talent Calculator"
      description="View and share talent builds using talent strings"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Talents" },
      ]}
    >
      <TalentCalculatorContent />
    </PageLayout>
  );
}
```

---

### R1.2: Restructure Navigation

**Violation**: IA-002, IA-004, IA-005
**Effort**: Low
**Impact**: High

**File**: `lib/menu-config.ts`

**Current structure**:
```
Simulate → Optimize → Discover (Rankings, Rotations) → Create (Editor) → Lab (Data Inspector, Spec Coverage, Talent Calculator) → About
```

**Target structure**:
```
Simulate → Plan (Talents) → Optimize → Discover (Rankings) → Rotations (Browse, Create) → Lab (Overview, Data Inspector, Spec Coverage) → About
```

**Implementation**:

```tsx
// menu-config.ts
export const menuConfig: MenuGroup[] = [
  group("Simulate", [
    item("Simulate", "/simulate", Play),
  ]),
  group("Plan", [
    item("Talents", "/talents", Calculator),
  ]),
  group("Optimize", [
    item("Optimize", "/optimize", Sparkles),
  ]),
  group("Discover", [
    item("Rankings", "/rankings", Trophy),
  ]),
  group("Rotations", [
    item("Browse", "/rotations", Swords),
    item("Create", "/rotations/editor", PencilRuler),
  ]),
  group("Lab", [
    item("Overview", "/lab", FlaskConical),
    item("Data Inspector", "/lab/data-inspector", Table),
    item("Spec Coverage", "/lab/spec-coverage", CheckSquare),
  ]),
  group("About", [
    item("About", "/about", FlaskConical),
    item("Changelog", "/changelog", History),
    item("Docs", "/docs", BookOpen),
    link("GitHub", env.GITHUB_REPO_URL, GitFork),
  ]),
];
```

---

### R1.3: Simplify Landing Page

**Violation**: Landing page overload
**Effort**: Medium
**Impact**: Medium

**Files to UPDATE**:

| File | Change |
|------|--------|
| `atoms/landing/state.ts` | Change `LandingCardId` type and default order |
| `components/landing/landing-content.tsx` | Remove `simulate` and `editor` cards, add `talents` card |

**Current cards**: `recent`, `quick-sim`, `simulate`, `optimize`, `rankings`, `rotations`, `editor`, `lab`

**Target cards**: `recent`, `quick-sim`, `talents`, `optimize`, `rankings`, `rotations`, `lab`

**Changes**:
- REMOVE `simulate` (duplicate of `quick-sim`)
- REMOVE `editor` (access via Rotations nav)
- ADD `talents` card linking to `/talents`

**Implementation**:

```tsx
// atoms/landing/state.ts
export type LandingCardId =
  | "recent"
  | "quick-sim"
  | "talents"
  | "optimize"
  | "rankings"
  | "rotations"
  | "lab";

export const landingOrderAtom = createPersistedOrderAtom<LandingCardId>(
  "landing-order-v6", // bump version
  [
    "recent",
    "quick-sim",
    "talents",
    "optimize",
    "rankings",
    "rotations",
    "lab",
  ],
);
```

```tsx
// components/landing/landing-content.tsx
// Add TalentsCard, remove SimulateCard and EditorCard

const TalentsCard = () => (
  <LandingCard
    href="/talents"
    icon={Calculator}
    title="Talents"
    description="Build talents"
    content="Interactive talent tree builder with import/export."
  />
);

const components: DashboardConfig<LandingCardId> = {
  recent: { Component: RecentCard, className: "sm:col-span-2" },
  "quick-sim": { Component: QuickSimCard, className: "sm:col-span-2" },
  talents: { Component: TalentsCard },
  optimize: { Component: OptimizeCard },
  rankings: { Component: RankingsCard },
  rotations: { Component: RotationsCard },
  lab: { Component: LabCard, className: "sm:col-span-2" },
};
```

---

### R1.4: Hide Incomplete Account Features

**Violation**: FC-001, FC-002
**Effort**: Low
**Impact**: Medium

**File**: `components/account/account-tabs.tsx`

**Current tabs**: Rotations, Characters, History

**Target tabs**: Rotations only

**Implementation**:

```tsx
// account-tabs.tsx
export function AccountTabs({ user, rotations }: Props) {
  return (
    <div className="space-y-6">
      <ProfileHeader user={user} rotationCount={rotations.length} />

      <UrlTabs
        defaultTab="rotations"
        tabs={[
          {
            value: "rotations",
            label: "Rotations",
            content: <RotationsTab rotations={rotations} />,
          },
        ]}
      />
    </div>
  );
}
```

**Also DELETE**:
- `CharactersTab` function
- `HistoryTab` function
- `mockHistory` constant

---

### R1.5: Fix Sign-In Page Layout

**Violation**: DC-001
**Effort**: Low
**Impact**: Medium

**File**: `app/auth/sign-in/page.tsx`

**Current**: Raw div wrapper without PageLayout
**Target**: Use PageLayout for consistency

**Implementation**:

```tsx
// app/auth/sign-in/page.tsx
import { PageLayout } from "@/components/page";
import { SignIn } from "@/components/auth/sign-in-content";

export default function SignInPage() {
  return (
    <PageLayout
      title="Sign In"
      description="Sign in to your account"
      breadcrumbs={[{ label: "Sign In" }]}
    >
      <div className="mx-auto max-w-md py-12">
        <SignIn />
      </div>
    </PageLayout>
  );
}
```

---

## Priority 2: Important (Do Soon)

### R2.1: Add CTAs to Simulation Results Page

**Violation**: UF-001
**Effort**: Medium
**Impact**: High

**File to CREATE**: `components/simulate/results/next-steps.tsx`

**File to UPDATE**: Add NextSteps to results tabs or page

**Implementation**:

```tsx
// components/simulate/results/next-steps.tsx
import Link from "next/link";
import { Sparkles, TrendingUp, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NextSteps() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What&apos;s Next?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/talents">
            <Sparkles className="mr-2 h-4 w-4" />
            Try Different Talents
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/optimize">
            <TrendingUp className="mr-2 h-4 w-4" />
            Optimize Gear
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rotations">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Rotations
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### R2.2: Add "Test Rotation" to Rotation Detail Page

**Violation**: UF-002
**Effort**: Medium
**Impact**: High

**Files to UPDATE**:
- `components/rotations/rotation-detail-page.tsx` - Add test button
- `atoms/sim/` - Add atom for active rotation

---

### R2.3: Connect Rankings to Tools

**Violation**: UF-004
**Effort**: Medium
**Impact**: Medium

**Files to UPDATE**:
- `components/rankings/top-talents-tab.tsx` - Add "Open in Calculator" links to `/talents?talents=...`
- `components/rankings/top-sims-tab.tsx` - Add "View Rotation" links

---

## Priority 3: Nice to Have (Do Later)

### R3.1: Standardize Container Widths

**File**: `app/page.tsx`

Change `max-w-5xl` to `max-w-7xl` to match other pages.

---

### R3.2: Add Path from Simulate to Optimize

Pass character context via Jotai atoms when navigating.

---

### R3.3: Wire Up Editor Test Button

**File**: `components/rotations/editor/rotation-editor.tsx`

Connect test button to simulation engine.

---

### R3.4: Progressive Auth Indication

**File**: `components/layout/app-sidebar.tsx`

Show lock icon or tooltip on Editor link when not authenticated.

---

### R3.5: Improve Breadcrumb Links

- Make Lab breadcrumb clickable (add href to `/lab`)
- Show rotation names instead of "View"

---

## Complete File Change Summary

### CREATE

| File | Purpose |
|------|---------|
| `app/talents/page.tsx` | Talent calculator page |
| `app/talents/loading.tsx` | Talent calculator loading skeleton |
| `components/simulate/results/next-steps.tsx` | Results page CTAs |

### MOVE

| From | To |
|------|-----|
| `components/lab/talent-calculator/talent-calculator-content.tsx` | `components/talents/talent-calculator-content.tsx` |
| `components/lab/talent-calculator/talent-calculator-skeleton.tsx` | `components/talents/talent-calculator-skeleton.tsx` |
| `components/lab/talent-calculator/talent-start-screen.tsx` | `components/talents/talent-start-screen.tsx` |
| `components/lab/talent-calculator/talent-state-message.tsx` | `components/talents/talent-state-message.tsx` |
| `components/lab/talent-calculator/talent-string-bar.tsx` | `components/talents/talent-string-bar.tsx` |
| `components/lab/talent-calculator/talent-encoding.ts` | `components/talents/talent-encoding.ts` |

### DELETE

| File | Reason |
|------|--------|
| `app/lab/talent-calculator/page.tsx` | Route moved |
| `app/lab/talent-calculator/loading.tsx` | Route moved |
| `components/lab/talent-calculator/index.ts` | Folder deleted |
| `components/lab/overview/cards/talent-calculator-card.tsx` | Not in Lab anymore |

### UPDATE

| File | Change |
|------|--------|
| `lib/menu-config.ts` | New nav structure |
| `atoms/landing/state.ts` | New card IDs |
| `components/landing/landing-content.tsx` | New cards |
| `components/talents/index.ts` | Export moved components |
| `components/talents/talent-hover-link.tsx` | Update link to `/talents` |
| `components/lab/overview/cards/index.ts` | Remove talent calculator export |
| `components/lab/overview/lab-content.tsx` | Remove TalentCalculatorCard |
| `components/account/account-tabs.tsx` | Remove Characters/History tabs |
| `app/auth/sign-in/page.tsx` | Use PageLayout |
