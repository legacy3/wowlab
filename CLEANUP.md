# Pre-Merge Cleanup Audit

Branch: `feat-paperdoll`

---

## Dead Files to Delete

| # | File | Reason |
|---|------|--------|
| 1 | `apps/portal/NEXT-INTL-REFACTOR.md` | Dead planning doc referencing `next-intl` - app uses `intlayer`. Never executed, never will be. |
| 2 | `apps/portal/src/components/fabric/IMPROVEMENTS.md` | Completed refactor notes. References `/tmp/fabric-analysis/` local paths. Historical artifact. |
| 3 | `packages/wowlab-parsers-0.4.0.tgz` | **Tracked in git.** Stale old version - 0.4.1 is current. |

---

## Stale Skill Documentation

| # | File:Line | Issue |
|---|-----------|-------|
| 4 | `.claude/skills/state-management/skill.md:54` | References `use-client-hardware.ts` which was deleted in cleanup commits |

---

## Misaligned Comments in `lib/state/index.ts`

| # | File:Line | Issue |
|---|-----------|-------|
| 5 | `apps/portal/src/lib/state/index.ts:1-14` | Section comments are rotated: "Computing" is correct, but then "Jobs" labels editor exports, "Editor" labels game exports, "Game" labels jobs exports. All wrong. |

---

## Debug Statements (production code, not tests)

| # | File:Line | Code |
|---|-----------|------|
| 6 | `apps/portal/src/components/account/nodes/nodes-page.tsx:89` | `console.log("Power on:", selectedIds)` |
| 7 | `apps/portal/src/components/account/nodes/nodes-page.tsx:94` | `console.log("Power off:", selectedIds)` |

---

## Unused `#[allow(dead_code)]` (methods never called anywhere)

| # | File:Line | What |
|---|-----------|------|
| 8 | `crates/engine/src/cli/output.rs:69-73` | `pub fn success()` - never called |
| 9 | `crates/engine/src/cli/output.rs:76-79` | `pub fn warn()` - never called |
| 10 | `crates/node/src/cache.rs:83-87` | `pub fn clear()` - never called |
| 11 | `crates/node/src/cache.rs:90-93` | `pub fn stats()` - never called |
| 12 | `crates/node/src/worker/pool.rs:18` | `#[allow(dead_code)]` on `WorkResult` - but the struct IS used. Stale annotation. |

---

## TODOs to Assess (pre-merge relevance)

| # | File:Line | TODO |
|---|-----------|------|
| 13 | `apps/portal/src/lib/engine/spell-desc.ts:9` | "TODO Redo this entire file function based" |
| 14 | `apps/portal/src/lib/state/spell-desc.ts:22` | Same TODO duplicated |
| 15 | `apps/portal/src/app/[locale]/account/page.tsx:5` | "TODO: Implement account overview page" (just redirects to nodes) |
| 16 | `apps/portal/src/lib/content/types.ts:1` | "TODO Get these types from the lib" |
| 17 | `apps/portal/src/components/content/md/md-mermaid.tsx:12` | "TODO: Add dark theme support" |
| 18 | `apps/portal/src/components/content/md/md-code.tsx:22` | "TODO Move this to recipe?" |
| 19 | `crates/engine/src/combat/damage/pipeline.rs:127` | "TODO Move this: Constant for level 80 target" (hardcoded `ARMOR_CONSTANT`) |
| 20 | `crates/engine/src/rotation/compiler.rs:599-623` | `UseTrinket`/`UseItem` stubbed with `let _ = slot/name` |
| 21 | `crates/engine/src/rotation/expr/spell.rs:48-64` | Multiple "TODO: Look up spell cost/cast_time/range from tuning" (all return 0.0) |

---

## Priority

**Must-fix before merge (items 1-7, 12):** Delete the dead files, fix the stale tgz, fix the comments, remove the debug logs, remove the stale `#[allow(dead_code)]` annotation on `WorkResult`.

**Should-fix (items 8-11):** Either use or remove the dead utility methods in the engine CLI and node cache.

**Acceptable to defer (items 13-21):** These TODOs are legitimate future work (equipment system, tuning integration, account page). They won't break anything as-is.
