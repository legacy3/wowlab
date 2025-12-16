# UI/UX Violations

Comprehensive list of all identified violations, organized by category.

---

## Information Architecture Violations

### IA-001: Talent Calculator Misplaced in Lab

**Severity**: HIGH
**Location**: Sidebar navigation, `/lab/talent-calculator`

**Description**: The Talent Calculator is categorized under "Lab" (experimental tools) but is a standard WoW tool that 60%+ of users would expect to find easily.

**Impact**: Users can't discover a core feature. New users may not realize it exists.

**Evidence**: Codex analysis confirmed: "Talent Calculator deserves promotion to the core nav... hiding it in Lab sends the wrong signal."

**Fix**: Move to primary navigation. Create "Plan" group or place between Simulate and Optimize.

---

### IA-002: Editor Too Prominent in Navigation

**Severity**: HIGH
**Location**: Sidebar navigation → Create → Editor

**Description**: The Rotation Editor is a feature for ~5% of users (theorycrafters) but has its own navigation group ("Create") at the same level as primary features.

**Impact**: Navigation feels unbalanced. Beginners see an advanced feature prominently.

**Fix**: Nest Editor under Rotations. Navigation: Rotations → Browse / Create (or Editor).

---

### IA-003: Most Wanted Items in Wrong Section

**Severity**: MEDIUM
**Location**: `/rankings` → "Most Wanted Items" tab

**Description**: "Most Wanted Items" is conceptually about gear optimization but lives under Rankings with discovery-focused content.

**Impact**: Users looking to optimize gear won't find this data. Duplication with Optimize/Drops.

**Fix**: Either move to Optimize section or rename to clarify community demand angle ("Community Demand").

---

### IA-004: Rotations and Editor Not Connected

**Severity**: MEDIUM
**Location**: Sidebar navigation

**Description**: Rotations (browse) and Editor (create) are in separate navigation groups despite being part of the same domain.

**Impact**: Forking workflow works, but mental model is broken. "Where do I edit rotations?"

**Fix**: Combine into single "Rotations" group with sub-items: Browse, My Rotations, New.

---

### IA-005: No Lab Overview Link in Sidebar

**Severity**: LOW
**Location**: Sidebar navigation → Lab group

**Description**: Lab group shows individual tools but no link to the Lab overview page (`/lab`).

**Impact**: Users must navigate through sub-items. Can't get overview of what's in Lab.

**Fix**: Add "Lab Overview" or "All Tools" link to Lab group.

---

### IA-006: Account Not in Navigation

**Severity**: LOW
**Location**: Sidebar navigation

**Description**: Account page exists but is only accessible via the auth button in navbar, not sidebar.

**Impact**: Inconsistent access patterns. Users may not find their saved rotations easily.

**Fix**: Consider adding Account to sidebar or ensure navbar icon is prominent.

---

## User Flow Violations

### UF-001: Simulation Results Dead End

**Severity**: HIGH
**Location**: `/simulate/results/[id]`

**Description**: After running a simulation, the results page shows data but offers no next steps or CTAs to continue the user journey.

**Impact**: Users complete their immediate goal but aren't guided to deepen engagement.

**Evidence**: Page has 4 tabs (Overview, Timeline, Charts, Event Log) but no "What's next?" section.

**Fix**: Add CTA section: "Try different talents", "Optimize your gear", "Browse similar rotations".

---

### UF-002: Rotation Detail Can't Test

**Severity**: HIGH
**Location**: `/rotations/[id]`

**Description**: Viewing a rotation shows the script but provides no way to test it with your character.

**Impact**: Users must manually fork, understand the script, then somehow run it. Friction kills adoption.

**Fix**: Add "Test with my character" button that loads the rotation into simulation context.

---

### UF-003: No Path from Simulate to Optimize

**Severity**: MEDIUM
**Location**: `/simulate` → `/optimize`

**Description**: After simulating, there's no clear path to gear optimization. Character data doesn't carry over.

**Impact**: Users must re-import character on Optimize page. Workflow breaks.

**Fix**: Pass character context via Jotai atoms. Add "Optimize Gear" CTA on results page.

---

### UF-004: Rankings Don't Link to Tools

**Severity**: MEDIUM
**Location**: `/rankings` tabs

**Description**: "Top Talents" shows talent combinations but doesn't link to Talent Calculator. "Top Sims" shows rotations but doesn't link to rotation details.

**Impact**: Discovery is one-way. Users see data but can't act on it.

**Fix**: Add inline links: "Open in Talent Calculator", "View Rotation".

---

## Design Consistency Violations

### DC-001: Sign-In Page Breaks Layout Pattern

**Severity**: MEDIUM
**Location**: `/auth/sign-in`

**Description**: Sign-in page uses centered full-screen layout instead of PageLayout wrapper used everywhere else.

**Evidence**:

```tsx
// sign-in/page.tsx
<div className="flex min-h-screen items-center justify-center p-4">
  <SignIn />
</div>
```

**Impact**: Jarring transition when navigating to sign-in. No breadcrumbs or navigation context.

**Fix**: Use PageLayout or create a consistent AuthLayout. Maintain sidebar visibility.

---

### DC-002: Landing Page Different Container Width

**Severity**: LOW
**Location**: `/` (landing page)

**Description**: Landing uses `max-w-5xl` container while all other pages use `max-w-7xl` via PageLayout.

**Evidence**:

```tsx
// page.tsx (landing)
<main className="container mx-auto max-w-5xl ...">

// page-layout.tsx (all other pages)
<div className="container mx-auto max-w-7xl ...">
```

**Impact**: Subtle but noticeable width change when navigating from landing to other pages.

**Fix**: Standardize on one container width (recommend `max-w-7xl` for consistency).

---

### DC-003: Inconsistent Page Headers

**Severity**: LOW
**Location**: `/` vs other pages

**Description**: Landing page has manual header markup. Other pages use `PageLayout` with `PageHeader`.

**Evidence**: Landing has `<h1>WoW Lab</h1>` manually styled. Others use `<PageHeader>`.

**Impact**: Slight visual inconsistency in header styling and spacing.

**Fix**: Either use PageLayout on landing or extract header component for reuse.

---

### DC-004: Draggable Dashboard Grid Variations

**Severity**: LOW
**Location**: Multiple pages

**Description**: Different pages use different grid configurations for DraggableDashboard.

**Evidence**:

- Landing: `sm:grid-cols-2 lg:grid-cols-4`
- Lab: `sm:grid-cols-2 lg:grid-cols-3`
- Data Inspector: `md:grid-cols-2`
- Top Gear: `md:auto-rows-min md:grid-cols-2`

**Impact**: Minor - each page has appropriate layout. But no standard pattern documented.

**Fix**: Document standard grid patterns. Low priority.

---

### DC-005: Mixed Link Components

**Severity**: LOW
**Location**: Various components

**Description**: Some components use Next.js `Link` directly, others use custom `@/components/ui/link`.

**Evidence**: Found in `quick-sim-content.tsx` using custom Link, others using Next.js Link.

**Impact**: Potential for inconsistent link styling or behavior.

**Fix**: Standardize on custom Link component if it adds value, or use Next.js Link everywhere.

---

## Feature Completeness Violations

### FC-001: Account Characters Tab Stub

**Severity**: MEDIUM
**Location**: `/account` → Characters tab

**Description**: Characters tab shows "No characters saved" with button to Import, but no actual character saving functionality exists.

**Evidence**:

```tsx
function CharactersTab() {
  return (
    <Card>
      <CardContent className="...">
        <p className="...">No characters saved</p>
        <p className="...">
          Import a character from the simulation page to save it here
        </p>
        // But saving doesn't exist!
      </CardContent>
    </Card>
  );
}
```

**Impact**: Misleading users. Promise of functionality that doesn't exist.

**Fix**: Either implement character saving or remove/hide tab. Add "Coming Soon" badge if keeping.

---

### FC-002: Account History Uses Mock Data

**Severity**: MEDIUM
**Location**: `/account` → History tab

**Description**: History tab shows hardcoded mock simulation history, not real user data.

**Evidence**:

```tsx
const mockHistory = [
  { id: 1, spec: "Shadow Priest", dps: 2847, ... },
  { id: 2, spec: "Shadow Priest", dps: 2691, ... },
  { id: 3, spec: "Shadow Priest", dps: 2534, ... },
];
```

**Impact**: Users see fake data. Erodes trust. Confusion when data doesn't match their activity.

**Fix**: Either implement real history or hide tab. Add clear "Preview" or "Coming Soon" indicator.

---

### FC-003: Test Button in Editor Not Implemented

**Severity**: LOW
**Location**: `/rotations/editor`

**Description**: Editor has "Test" button but handler just does a 1-second timeout placeholder.

**Evidence**:

```tsx
const handleTest = async () => {
  setIsTesting(true);
  // TODO: Wire up simulation here
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setIsTesting(false);
};
```

**Impact**: Button exists but doesn't work. User expects to test rotation.

**Fix**: Wire up to simulation engine or hide button until implemented.

---

## Progressive Disclosure Violations

### PD-001: Advanced Settings Not Progressive

**Severity**: LOW
**Location**: `/simulate` (Quick Sim Content)

**Description**: Advanced settings (fight duration, iterations) are collapsed by default (good), but their existence is visible to all users.

**Impact**: Minor - current collapse pattern is acceptable. Could be improved.

**Fix**: Consider hiding advanced toggle entirely for first-time users. Show after first sim.

---

### PD-002: Editor Auth Wall After Click

**Severity**: MEDIUM
**Location**: `/rotations/editor`

**Description**: User can click Editor in navigation, then sees "Sign in required" message. Auth requirement isn't clear before navigation.

**Impact**: Wasted click. User must navigate away to sign in, then return.

**Fix**: Options:

1. Disable Editor link when not authenticated (with tooltip)
2. Redirect to sign-in with return URL
3. Add lock icon to nav item when not authenticated

---

### PD-003: Rotation Metadata Before Editor

**Severity**: LOW
**Location**: `/rotations/editor`

**Description**: User must fill out metadata form (name, class, spec) before seeing the editor.

**Impact**: Adds friction. User might want to explore editor before committing to a rotation.

**Fix**: Consider allowing editor exploration first, require metadata on save. Or provide templates that pre-fill metadata.

---

## Accessibility Violations

### A11Y-001: No Skip Links

**Severity**: LOW
**Location**: Global layout

**Description**: No skip-to-content links for keyboard navigation.

**Fix**: Add skip link to main content area.

---

### A11Y-002: Draggable Dashboard Keyboard Support

**Severity**: LOW
**Location**: Draggable dashboard components

**Description**: Drag-and-drop reordering may not be fully keyboard accessible.

**Fix**: Audit dnd-kit configuration. Add keyboard instructions.

---

## Summary Table

| ID       | Category               | Severity | Quick Description              |
| -------- | ---------------------- | -------- | ------------------------------ |
| IA-001   | Info Architecture      | HIGH     | Talent Calculator in Lab       |
| IA-002   | Info Architecture      | HIGH     | Editor too prominent           |
| IA-003   | Info Architecture      | MEDIUM   | Most Wanted Items placement    |
| IA-004   | Info Architecture      | MEDIUM   | Rotations/Editor not connected |
| IA-005   | Info Architecture      | LOW      | No Lab overview link           |
| IA-006   | Info Architecture      | LOW      | Account not in sidebar         |
| UF-001   | User Flow              | HIGH     | Results page dead end          |
| UF-002   | User Flow              | HIGH     | Can't test rotations           |
| UF-003   | User Flow              | MEDIUM   | No Simulate → Optimize path    |
| UF-004   | User Flow              | MEDIUM   | Rankings don't link to tools   |
| DC-001   | Design                 | MEDIUM   | Sign-in breaks layout          |
| DC-002   | Design                 | LOW      | Container width inconsistent   |
| DC-003   | Design                 | LOW      | Header inconsistency           |
| DC-004   | Design                 | LOW      | Grid variations                |
| DC-005   | Design                 | LOW      | Mixed Link components          |
| FC-001   | Completeness           | MEDIUM   | Characters tab stub            |
| FC-002   | Completeness           | MEDIUM   | History mock data              |
| FC-003   | Completeness           | LOW      | Test button not wired          |
| PD-001   | Progressive Disclosure | LOW      | Advanced settings visible      |
| PD-002   | Progressive Disclosure | MEDIUM   | Editor auth wall timing        |
| PD-003   | Progressive Disclosure | LOW      | Metadata before editor         |
| A11Y-001 | Accessibility          | LOW      | No skip links                  |
| A11Y-002 | Accessibility          | LOW      | Drag-drop keyboard             |
