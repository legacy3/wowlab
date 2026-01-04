# Engine Refactoring Analysis

Analysis date: 2026-01-04
Last updated: 2026-01-04

## Summary

The engine codebase is well-architected with clean module separation and no circular dependencies. However, rapid feature additions have introduced DRY violations and incomplete abstractions that should be addressed for sustainable growth.

## Progress Checklist

### P0 - Low Effort, Code Quality

- [x] **01** - Duplicate aura apply/remove methods → `modify_aura_effect()` with sign param
- [x] **02** - Duplicate damage calculations → `calculate_scaled_damage()` helpers
- [x] **04** - Duplicate PetType enum → Single source in `types.rs`

### P1 - Medium Effort, Multi-class + Debug

- [x] **06** - Incomplete coefficient coverage → All 39 specs with SimC data
- [x] **11** - Silent failures in AuraTracker → debug_assert! in 10 methods + apply_aura_inline
- [x] **12** - String errors in CLI → Typed ConfigError with 9 variants

### P2 - High Effort, Accuracy (40%→80%)

- [x] **07** - Missing trait/proc system → `traits` module with ProcTracker
- [ ] **08** - Missing pet ability system
- [ ] **09** - Rigid SpellEffect enum

### P3 - Low Effort, Polish

- [x] **03** - Duplicate rating stat computation → `compute_rating_stat()` helper
- [x] **05** - Duplicate attribute match statements → `flat_mut()`/`pct_mut()` accessors
- [x] **10** - No mastery formula differentiation → `MasteryEffect` enum with 5 variants

### P4 - Medium Effort, Robustness

- [ ] **13** - Unchecked array indexing
- [ ] **14** - Validation gaps in parallel paths
- [ ] **15** - Cast truncation without guards
- [ ] **16** - String matching instead of enums
- [ ] **17** - Missing newtype wrappers

**Progress: 10/17 complete**

---

## Health Overview

| Aspect           | Status               | Notes                                                                  |
| ---------------- | -------------------- | ---------------------------------------------------------------------- |
| Module Structure | Excellent            | Clean layers, ~9.4K lines                                              |
| Combat System    | ~~DRY Issues~~ Fixed | ~~4 duplicate damage calc sites~~ Consolidated                         |
| Paperdoll/Stats  | Solid                | Well-designed, all specs now have coefficients                         |
| Spec Coverage    | ~~Limited~~ Improved | All 39 specs have coefficients, no talents/procs yet                   |
| Error Handling   | ~~Gaps~~ Improved    | ~~Silent failures~~ debug_assert!, ~~string errors~~ typed ConfigError |
| Type Safety      | Good                 | Proper enums, minimal unsafe                                           |

## Issue Categories

### DRY Violations (01-05)

- 01: Duplicate aura apply/remove methods
- 02: Duplicate damage calculations
- 03: Duplicate rating stat computation
- 04: Duplicate PetType enum definitions
- 05: Duplicate attribute match statements

### Architecture Gaps (06-10)

- 06: Incomplete coefficient coverage
- 07: Missing talent/proc system
- 08: Missing pet ability system
- 09: Rigid SpellEffect enum
- 10: No mastery formula differentiation

### Error Handling (11-14)

- 11: Silent failures in AuraTracker
- 12: String errors in CLI
- 13: Unchecked array indexing
- 14: Validation gaps in parallel paths

### Type Safety (15-17)

- 15: Cast truncation without guards
- 16: String matching instead of enums
- 17: Missing newtype wrappers

## Priority Matrix

| Priority | Issues     | Effort | Impact              |
| -------- | ---------- | ------ | ------------------- |
| P0       | 01, 02, 04 | Low    | Code quality        |
| P1       | 06, 11, 12 | Medium | Multi-class + debug |
| P2       | 07, 08, 09 | High   | Accuracy 40%→80%    |
| P3       | 03, 05, 10 | Low    | Polish              |
| P4       | 13-17      | Medium | Robustness          |
