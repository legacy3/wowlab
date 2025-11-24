# Migration Status: innocent-_→ @wowlab/_

**Status:** 🟡 In Progress (30-40% Complete)
**Last Updated:** 2025-11-24
**Safe to Remove Old Packages:** ❌ NO (apps/portal and apps/cli still depend on them)

---

## Executive Summary

The WowLab codebase has two parallel package systems: old `@packages/innocent-*` and new `@wowlab/*`. The new `apps/standalone` successfully demonstrates the @wowlab/\* architecture works. However, `apps/portal` and `apps/cli` still depend on the old packages.

**Key Finding:** The new system has better architecture. Migrate portal/cli to @wowlab/_, then remove innocent-_ packages.

---

## Package Architecture

### OLD SYSTEM (innocent-\*)

| Package                        | Purpose                                    | Status                         |
| ------------------------------ | ------------------------------------------ | ------------------------------ |
| `@packages/innocent-domain`    | Domain entities and types                  | ✓ Migrated to @wowlab/core     |
| `@packages/innocent-schemas`   | Data schemas (DBC, Character, Item, Spell) | ⚠️ Partially migrated          |
| `@packages/innocent-services`  | Core services (21+ services)               | ⚠️ Partially migrated          |
| `@packages/innocent-rotation`  | Rotation API                               | ✓ Migrated to @wowlab/rotation |
| `@packages/innocent-spellbook` | Spell definitions for all classes/specs    | ❌ NOT migrated                |
| `@packages/innocent-bootstrap` | Layer composition utilities                | ✓ Migrated to @wowlab/runtime  |
| `@packages/innocent-parsers`   | SimC profile parser                        | ❌ NOT migrated                |

### NEW SYSTEM (@wowlab/\*)

| Package            | Purpose                                  | Replaces                           |
| ------------------ | ---------------------------------------- | ---------------------------------- |
| `@wowlab/core`     | Domain entities, schemas, events, errors | innocent-domain + innocent-schemas |
| `@wowlab/services` | Core services (~15 services)             | innocent-services (subset)         |
| `@wowlab/rotation` | Rotation API                             | innocent-rotation                  |
| `@wowlab/runtime`  | App layer factory                        | innocent-bootstrap                 |

### Applications

| App                 | Uses OLD            | Uses NEW         | Notes                               |
| ------------------- | ------------------- | ---------------- | ----------------------------------- |
| **apps/portal**     | ✓ All packages      | ❌ None          | Needs migration to @wowlab/\*       |
| **apps/cli**        | ✓ schemas, services | ✓ core, services | Mixed dependencies, needs migration |
| **apps/standalone** | ❌ None             | ✓ All packages   | Primary development target          |
| **apps/mcp-server** | ❌ None             | ❌ None          | Independent                         |

---

## What's Been Migrated

### ✓ Core Entities (wowlab-core)

- Aura, GameState, PaperDoll, Position
- Power, Projectile, Spell, Unit
- Transform utilities

### ✓ Schemas (wowlab-core)

- All DBC schemas (19 database tables)
- Spell, Item, Aura schemas
- Branded types (UnitID, SpellID, AuraID, etc.)
- Enum definitions

### ✓ Services (wowlab-services)

- AccessorService (Unit, Spell)
- CastQueueService
- DataService (SpellInfo, DbcCache, CSV loader)
- EventSchedulerService
- LifecycleService
- LogService
- MetadataService
- PeriodicTriggerService
- ProfileComposer
- RNGService
- RotationProviderService
- SimulationService
- SpellService
- StateService
- UnitService

### ✓ Rotation API (wowlab-rotation)

- RotationContext
- Spell actions
- Control actions (sequence, wait, condition)

### ✓ Runtime (wowlab-runtime)

- AppLayer factory (createAppLayer)
- Service composition patterns

---

## What's Still Only in innocent-\*

### Spellbook System

**Location:** `packages/innocent-spellbook/src/internal/spells/`

- 36+ class/spec implementations (13 classes × 2-4 specs each)
- Class-specific spell modifiers (HotStreak, HeatingUp, Frenzy, BeastCleave, etc.)
- Spell overrides and customizations
- Spell registry system

**Impact:** Can't simulate multiple classes/specs. Port individual specs as needed.

---

### Spell Modifiers System

**Location:** `packages/innocent-services/src/internal/modifiers/`

- Modifier framework (ClearCastingState, ConsumeSpellResource, LaunchSpellProjectile, TriggerSpellCooldown)
- Modifier runtime and execution

**Impact:** No proc effects, cooldown interactions, resource consumption, projectile mechanics. Reimplement if needed.

---

### SimC Parser

**Location:** `packages/innocent-parsers/src/internal/simc/SimcParser.ts`

- 300+ lines of SimC profile parsing
- Character gear, talents, professions

**Impact:** Can't import SimC profiles. Build a new parser if you need this feature.

---

### Character Schemas

**Location:** `packages/innocent-schemas/src/internal/character/`

- CharacterProfile, GearItem, Talent schemas

**Impact:** No character/gear system. Add to @wowlab/core if needed.

---

### Projectile Service

**Location:** `packages/innocent-services/src/internal/projectile/ProjectileService.ts`

- 150+ lines of projectile flight logic
- Travel time calculations

**Impact:** Spells with travel time won't work. Port if needed.

---

### Combat Utilities

**Location:** `packages/innocent-services/src/internal/combat/CombatUtils.ts`

- Combat calculation helpers

**Impact:** Minor - reimplement as needed.

---

## apps/standalone Status

### What It Is

Minimal proof-of-concept demonstrating the new @wowlab/\* architecture. Shows the new packages work correctly.

### What It Contains

- CLI Framework (Effect CLI)
- Data Loading (Supabase spell loader)
- Runtime Factory (rotation runtime, layer composition)
- Sample Rotations (Beast Mastery Hunter, Fire Mage)
- Simulation Runner (event collection, timeline logging)

### What It's Missing

- Spell modifier system (no procs)
- Multiple class/spec implementations (only 1-2 rotations)
- Character/gear system (no SimC import)
- Projectile handling (no travel time)

---

## Current Dependencies

### apps/portal

Depends on ALL innocent-_packages. Needs migration to @wowlab/_ before old packages can be removed.

### apps/cli

Mixed dependencies on both systems. Needs full migration to @wowlab/\*.

### apps/standalone

✓ Already using only @wowlab/\*

---

## Recommendation

### Migrate Portal and CLI, Then Remove innocent-\*

**Current blockers:**

- apps/portal depends on ALL innocent-\* packages
- apps/cli has mixed dependencies

**What to do:**

1. **Migrate apps/portal** to @wowlab/\*
2. **Migrate apps/cli** to @wowlab/\*
3. **Remove innocent-\* packages** once no dependencies remain
4. **Port missing features as needed** during migration

**Features to port during migration:**

- Spell modifier system (needed for procs/cooldowns)
- Spellbook implementations (needed for multiple classes/specs)
- SimC parser (if portal uses profile import)
- Character schemas (if portal uses character/gear system)

**Features you can skip:**

- Combat utilities (reimplement as needed)
- Projectile service (rebuild if needed)

---

## Migration Checklist

To remove innocent-\* packages:

- [ ] Migrate apps/portal to @wowlab/\*
- [ ] Migrate apps/cli to @wowlab/\*
- [ ] Port required features (modifiers, spellbook, parser, etc.)
- [ ] Verify no imports from @packages/innocent-\* anywhere
- [ ] Delete innocent-\* packages
- [ ] Update pnpm workspace config
- [ ] Run pnpm build to verify everything works
- [ ] Update documentation references

---

## Summary

**Old system:** Monolithic, 7 packages, legacy code
**New system:** Clean architecture, 4 packages, Effect-TS patterns
**Status:** New system works (proven by apps/standalone)

apps/portal and apps/cli still depend on the old packages, so they need to be migrated before innocent-\* can be removed. Port features as you migrate. The new architecture is better - migrate apps incrementally and bring over what you need.

---

## References

- Old System: `packages/innocent-*/`
- New System: `packages/@wowlab/*/`
- Standalone App: `apps/standalone/`
- Portal App: `apps/portal/`
- Analysis Date: 2025-11-24
