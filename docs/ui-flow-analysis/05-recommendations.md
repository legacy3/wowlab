# Recommendations

Prioritized list of fixes with implementation notes.

## Priority 1: Critical (Do First)

### R1.1: Move Talent Calculator to Primary Navigation

**Violation**: IA-001
**Effort**: Low
**Impact**: High

**What to do**:

1. Update `menu-config.ts` to move Talent Calculator to new group or after Simulate
2. Consider renaming route from `/lab/talent-calculator` to `/talents`
3. Update any hardcoded links

**Implementation**:

```tsx
// menu-config.ts - Option A: New "Plan" group
group("Plan", [
  item("Talents", "/talents", Calculator),
]),

// Or Option B: Ungrouped item after Simulate
// Requires menu-config refactor to support ungrouped items
```

**Redirect** (if changing URL):

```tsx
// app/lab/talent-calculator/page.tsx
import { redirect } from "next/navigation";
export default function () {
  redirect("/talents");
}
```

---

### R1.2: Add CTAs to Simulation Results Page

**Violation**: UF-001
**Effort**: Medium
**Impact**: High

**What to do**:
Add a "What's Next?" section at the bottom of the results page with clear CTAs.

**Implementation**:

```tsx
// New component: components/simulate/results/next-steps.tsx
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

Add to results tabs or as a standalone section after tabs.

---

### R1.3: Nest Editor Under Rotations

**Violation**: IA-002, IA-004
**Effort**: Low
**Impact**: Medium

**What to do**:
Restructure navigation so Editor is part of Rotations group.

**Implementation**:

```tsx
// menu-config.ts
group("Rotations", [
  item("Browse", "/rotations", Library),
  item("Create", "/rotations/editor", PencilRuler),
]),
```

Remove the "Create" group entirely.

---

### R1.4: Add "Test Rotation" to Rotation Detail Page

**Violation**: UF-002
**Effort**: Medium
**Impact**: High

**What to do**:
Add button to load rotation into simulation context.

**Implementation**:

```tsx
// In rotation-detail-page.tsx
<Button
  variant="default"
  size="sm"
  onClick={() => {
    // Store rotation in Jotai atom
    setActiveRotation(rotation);
    router.push("/simulate");
  }}
>
  <Play className="mr-2 h-4 w-4" />
  Test with My Character
</Button>
```

Requires:

1. New atom to hold "active rotation for simulation"
2. Simulate page to check for and use this rotation
3. Clear the atom after simulation runs

---

## Priority 2: Important (Do Soon)

### R2.1: Simplify Landing Page

**Violation**: Landing page overload
**Effort**: Medium
**Impact**: Medium

**What to do**:
Reduce to 4 primary cards, collapse others into "More Tools" section.

**Implementation**:

```tsx
// landing-content.tsx
const primaryCards: LandingCardId[] = [
  "quick-sim",
  "recent",
  "optimize",
  "rankings",
];

const secondaryCards: LandingCardId[] = [
  "rotations",
  "talents", // After moving from Lab
  "lab",
];

// Render primary cards in main grid
// Render secondary in collapsible "More Tools" section
```

---

### R2.2: Hide or Mark Incomplete Features

**Violation**: FC-001, FC-002
**Effort**: Low
**Impact**: Medium

**What to do**:
Either hide Characters/History tabs or add clear "Coming Soon" indicators.

**Option A: Hide**:

```tsx
// account-tabs.tsx
<UrlTabs
  defaultTab="rotations"
  tabs={[
    { value: "rotations", label: "Rotations", content: <RotationsTab /> },
    // Remove Characters and History tabs
  ]}
/>
```

**Option B: Mark Coming Soon**:

```tsx
{
  value: "characters",
  label: (
    <span className="flex items-center gap-2">
      Characters
      <Badge variant="outline" className="text-xs">Soon</Badge>
    </span>
  ),
  content: <ComingSoonPlaceholder feature="Characters" />,
}
```

---

### R2.3: Fix Sign-In Page Layout

**Violation**: DC-001
**Effort**: Low
**Impact**: Medium

**What to do**:
Use PageLayout or consistent AuthLayout.

**Implementation**:

```tsx
// auth/sign-in/page.tsx
import { PageLayout } from "@/components/page";

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

### R2.4: Add Lab Overview Link to Navigation

**Violation**: IA-005
**Effort**: Low
**Impact**: Low

**What to do**:
Add link to Lab hub page in Lab navigation group.

**Implementation**:

```tsx
// menu-config.ts
group("Lab", [
  item("Overview", "/lab", FlaskConical),
  item("Data Inspector", "/lab/data-inspector", Table),
  item("Spec Coverage", "/lab/spec-coverage", CheckSquare),
]),
```

---

### R2.5: Connect Rankings to Tools

**Violation**: UF-004
**Effort**: Medium
**Impact**: Medium

**What to do**:
Add inline links from Rankings tabs to relevant tools.

**Implementation in Top Talents tab**:

```tsx
// When displaying a talent build
<Button variant="ghost" size="sm" asChild>
  <Link href={`/talents?talents=${encodedTalents}`}>
    <ExternalLink className="mr-1 h-3 w-3" />
    Open in Calculator
  </Link>
</Button>
```

**Implementation in Top Sims tab**:

```tsx
// When displaying a rotation
<Button variant="ghost" size="sm" asChild>
  <Link href={`/rotations/${rotationId}`}>View Rotation</Link>
</Button>
```

---

## Priority 3: Nice to Have (Do Later)

### R3.1: Standardize Container Widths

**Violation**: DC-002
**Effort**: Low
**Impact**: Low

**What to do**:
Update landing page to use same max-width as other pages.

```tsx
// page.tsx (landing)
<main className="container mx-auto max-w-7xl space-y-6 px-4 py-6">
```

Or use PageLayout if appropriate for landing.

---

### R3.2: Add Path from Simulate to Optimize

**Violation**: UF-003
**Effort**: Medium
**Impact**: Medium

**What to do**:
Pass character context when navigating from Simulate to Optimize.

**Implementation**:
Character data is already in Jotai atoms. Optimize page needs to:

1. Check if `parsedCharacterAtom` has data
2. Use it to populate Top Gear starting point
3. Show "Using character: {name}" indicator

---

### R3.3: Wire Up Editor Test Button

**Violation**: FC-003
**Effort**: High
**Impact**: Medium

**What to do**:
Connect the Test button to actually run a simulation with the current script.

This requires:

1. Saving script to temporary state
2. Running simulation engine with script
3. Displaying results inline or navigating to results

---

### R3.4: Progressive Auth Indication

**Violation**: PD-002
**Effort**: Low
**Impact**: Low

**What to do**:
Indicate auth requirement before user clicks Editor.

**Implementation**:

```tsx
// In app-sidebar.tsx, when rendering Editor item
const isAuthenticated = useIsAuthenticated();

<SidebarMenuButton
  asChild
  isActive={isActive}
  tooltip={isAuthenticated ? item.label : `${item.label} (Sign in required)`}
  className={!isAuthenticated ? "opacity-60" : ""}
>
```

Or add a small lock icon to the nav item.

---

### R3.5: Improve Breadcrumb Links

**Violation**: Breadcrumb issues (see nav architecture doc)
**Effort**: Low
**Impact**: Low

**What to do**:

1. Make Lab breadcrumb clickable
2. Show rotation names instead of "View"
3. Standardize About/Changelog breadcrumbs

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

- [ ] R1.1: Move Talent Calculator
- [ ] R1.3: Nest Editor under Rotations
- [ ] R2.2: Hide incomplete features
- [ ] R2.4: Add Lab overview link

### Phase 2: User Flow (3-5 days)

- [ ] R1.2: Add CTAs to Results page
- [ ] R1.4: Add "Test Rotation" button
- [ ] R2.5: Connect Rankings to tools

### Phase 3: Polish (2-3 days)

- [ ] R2.1: Simplify Landing page
- [ ] R2.3: Fix Sign-in layout
- [ ] R3.1: Standardize container widths
- [ ] R3.4: Progressive auth indication
- [ ] R3.5: Improve breadcrumbs

### Phase 4: Advanced (ongoing)

- [ ] R3.2: Simulate to Optimize path
- [ ] R3.3: Wire up Editor test
- [ ] Implement actual Characters feature
- [ ] Implement actual History feature

## Success Metrics

After implementing these changes, measure:

1. **Navigation efficiency**: Clicks to complete common tasks
2. **Feature discovery**: % of users who find Talent Calculator
3. **Engagement depth**: Users who go from Simulate → another feature
4. **Rotation adoption**: Conversions from Detail → Fork/Test
5. **User retention**: Return visits after first simulation

## Code Locations for Changes

| Recommendation | Primary Files                                                 |
| -------------- | ------------------------------------------------------------- |
| R1.1           | `lib/menu-config.ts`, `app/lab/talent-calculator/page.tsx`    |
| R1.2           | `components/simulate/results/` (new file)                     |
| R1.3           | `lib/menu-config.ts`                                          |
| R1.4           | `components/rotations/rotation-detail-page.tsx`, `atoms/sim/` |
| R2.1           | `components/landing/landing-content.tsx`, `atoms/landing.ts`  |
| R2.2           | `components/account/account-tabs.tsx`                         |
| R2.3           | `app/auth/sign-in/page.tsx`                                   |
| R2.4           | `lib/menu-config.ts`                                          |
| R2.5           | `components/rankings/` (multiple files)                       |
| R3.1           | `app/page.tsx`                                                |
| R3.2           | `components/optimize/`, `atoms/sim/`                          |
| R3.3           | `components/rotations/editor/rotation-editor.tsx`             |
| R3.4           | `components/layout/app-sidebar.tsx`                           |
| R3.5           | Multiple page.tsx files                                       |
