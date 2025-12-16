# User Flow Analysis

Analysis of user journeys through the WoW Lab portal, organized by user type and task complexity.

## User Personas

### 1. Casual Player (80% of users)

**Goal**: "I want to see how much DPS I do"
**Technical Level**: Low
**Expected Journey**: Paste SimC → Run Sim → See Results → Done

### 2. Optimizer (15% of users)

**Goal**: "I want to improve my character's performance"
**Technical Level**: Medium
**Expected Journey**: Simulate → Compare Talents → Check Rankings → Optimize Gear → Re-simulate

### 3. Theorycrafter (5% of users)

**Goal**: "I want to create and share rotation scripts"
**Technical Level**: High
**Expected Journey**: Browse Rotations → Fork → Edit → Test → Publish → Iterate

## Funnel Principle: Easy to Complex

The ideal progression should follow **Most Users → Fewest Users**:

```
SIMULATE (80%) → PLAN/TALENTS (60%) → OPTIMIZE (40%) → DISCOVER (20%) → CREATE (5%)
```

### Current Navigation Order

```
Simulate → Optimize → Rankings/Rotations → Editor → Lab → About
```

### Problems with Current Order

1. **Talent Calculator Hidden**: 60% of users want to check/modify talents, but it's buried in Lab
2. **Editor Too Prominent**: Only 5% of users create rotations, but Editor has primary nav placement
3. **Optimize Before Plan**: Users should plan talents before optimizing gear
4. **Rankings/Rotations Split**: "Discover" concept is right, but these could be unified

## User Journey Analysis

### Journey 1: First-Time Simulation

**Current Flow**:

```
Landing → Click "Simulate" or use "Quick Sim" → Paste SimC → Run → See inline results
```

**Issues**:

1. Two entry points to same destination (Simulate card + Quick Sim card)
2. Results show inline with no obvious next steps
3. "View full results" link exists but isn't prominent
4. No suggestion to "Try different talents" or "Check rankings"

**Ideal Flow**:

```
Landing → Simulate (single entry) → Run → Results Page → CTAs: [Try Talents] [Optimize Gear] [Browse Rotations]
```

---

### Journey 2: Talent Exploration

**Current Flow**:

```
Landing → Lab → Talent Calculator → Select Spec → Explore talents
```

**Issues**:

1. Users must know to look in "Lab" (unexpected location)
2. No connection between Talent Calculator and Simulate
3. Can't easily "simulate with these talents"
4. Talent strings are shareable but not integrated

**Ideal Flow**:

```
Landing → Talents (primary nav) → Select Spec → Explore → [Simulate with these talents]
```

---

### Journey 3: Gear Optimization

**Current Flow**:

```
Landing → Optimize → Top Gear tab → (requires character data somehow)
```

**Issues**:

1. Where does character data come from?
2. No clear path from Simulate → Optimize
3. "Drops" tab exists but relationship to "Most Wanted Items" in Rankings unclear

**Ideal Flow**:

```
Simulate → Results → [Optimize Gear] CTA → Optimize page (character data passed)
```

---

### Journey 4: Rotation Discovery

**Current Flow**:

```
Landing → Rotations → Browse → Click rotation → View detail page
```

**Issues**:

1. Detail page has no "Test this rotation" functionality
2. Fork button exists but goes to Editor (good)
3. No way to see rotation in action before forking

**Ideal Flow**:

```
Landing → Rotations → Browse → Click → Detail → [Test with my character] → Simulation with this rotation
```

---

### Journey 5: Rotation Creation

**Current Flow**:

```
Landing → Editor → (Auth required) → Metadata setup → Write script → Save
```

**Issues**:

1. Auth wall appears AFTER clicking Editor
2. No templates or guided workflow for beginners
3. Testing requires manual setup
4. Fork workflow from existing rotation works well

**Ideal Flow**:

```
Rotations → Find similar rotation → Fork → Modify → Test inline → Save
```

---

### Journey 6: Checking Rankings

**Current Flow**:

```
Landing → Rankings → Tabs: Spec Rankings / Top Talents / Most Wanted Items / Top Sims
```

**Issues**:

1. "Most Wanted Items" overlaps with Optimize/Drops
2. "Top Talents" doesn't link to Talent Calculator
3. "Top Sims" doesn't link to those specific rotations

**Ideal Flow**:

```
Rankings → Spec Rankings → Click spec → See top talents (link to calculator) + top rotations (link to browse)
```

## Dead Ends (Pages with No Forward Path)

1. **Simulation Results**: Shows data but no CTAs to continue
2. **Rotation Detail**: Can fork but can't test
3. **Account History**: Placeholder data, no real functionality
4. **Data Inspector**: Developer tool, dead end acceptable

## Missing Connections

| From                   | To                | Why                        |
| ---------------------- | ----------------- | -------------------------- |
| Sim Results            | Talent Calculator | "Try different talents"    |
| Sim Results            | Optimize          | "Improve your gear"        |
| Sim Results            | Rotations         | "Try a community rotation" |
| Rotation Detail        | Simulate          | "Test this rotation"       |
| Rankings (Top Talents) | Talent Calculator | "Explore this build"       |
| Rankings (Top Sims)    | Rotation Detail   | "See this rotation"        |
| Talent Calculator      | Simulate          | "Run with these talents"   |

## Recommended Navigation Restructure

```
SIMULATE (primary action)
├── Quick Sim from landing
└── Full Simulate page

PLAN (new group)
├── Talent Calculator (moved from Lab)
└── (future: Build Planner)

OPTIMIZE
├── Top Gear
└── Drops

DISCOVER
├── Rankings
│   ├── Spec Rankings
│   ├── Top Talents → links to Talent Calculator
│   └── Top Sims → links to Rotations
└── Rotations
    ├── Browse
    └── Editor (nested, not primary)

LAB (experimental only)
├── Data Inspector
├── Spec Coverage
└── (other dev tools)

ABOUT
├── Overview
├── Changelog
├── Docs
└── GitHub
```

## Action Items

1. **Add CTAs to Results page**: "Try different talents", "Optimize gear", "Browse rotations"
2. **Move Talent Calculator**: From Lab to new "Plan" section or Simulate group
3. **Nest Editor under Rotations**: Browse → Detail → Fork → Editor
4. **Connect Rankings to tools**: Top Talents → Calculator links, Top Sims → Rotation links
5. **Add "Test rotation" to detail page**: Load rotation into simulation context
