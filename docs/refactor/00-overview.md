# Engine Rewrite Plan

## Overview

Create a new engine from scratch at `crates/engine_new/`. The old `crates/engine/` stays untouched until the new one is complete and validated.

## Setup

```bash
cd /Users/user/Source/wowlab
mkdir -p crates/engine_new/src
cd crates/engine_new
cargo init --lib --name engine_new
```

## Phases

| Phase | Name           | Depends On | Deliverable                                   |
| ----- | -------------- | ---------- | --------------------------------------------- |
| 01    | Types          | -          | All core type definitions                     |
| 02    | Core           | 01         | Event queue, RNG                              |
| 03    | Stats          | 01         | Stat system, ratings, cache                   |
| 04    | Resources      | 01, 03     | Resource pools, regen                         |
| 05    | Combat         | 01-04      | Damage pipeline, cooldowns, action state      |
| 06    | Auras          | 01-05      | Buffs, debuffs, periodic, per-target tracking |
| 07    | Procs          | 01-06      | RPPM, BLP, proc flags, callbacks              |
| 08    | Actors         | 01-07      | Player, pet, enemy                            |
| 09    | Spec Framework | 01-08      | Spell/Aura traits, CastContext, builders      |
| 10    | Simulation     | 01-09      | SimState, main loop, batch runner             |
| 11    | Rotation       | 01-10      | Rhai integration                              |
| 12    | Results        | 01-11      | Statistics, damage breakdown, trace           |
| 13    | BM Hunter      | 01-12      | First complete spec                           |
| 14    | CLI            | 01-13      | Command-line interface                        |

## How to Use Each Phase File

Give the phase file (e.g., `01-types.md`) to a fresh AI with:

```
Crate location: /Users/user/Source/wowlab/crates/engine_new
Follow the spec exactly. Run success criteria when done.
```

Each phase file contains:

- Goal
- Prerequisites
- Files to create
- Full code specifications
- Success criteria (tests)
- Todo checklist

## Estimated Size

| Phase             | Files   | Lines       | Tests   | Cumulative |
| ----------------- | ------- | ----------- | ------- | ---------- |
| 01 Types          | 8       | 400         | 11      | 11         |
| 02 Core           | 4       | 500         | 7       | 18         |
| 03 Stats          | 8       | 1200        | 8       | 26         |
| 04 Resources      | 4       | 600         | 12      | 38         |
| 05 Combat         | 12      | 1800        | 13      | 51         |
| 06 Auras          | 8       | 1000        | 13      | 64         |
| 07 Procs          | 7       | 800         | 14      | 78         |
| 08 Actors         | 10      | 1200        | 15      | 93         |
| 09 Spec Framework | 5       | 600         | 12      | 105        |
| 10 Simulation     | 6       | 1000        | 13      | 118        |
| 11 Rotation       | 5       | 800         | 14      | 132        |
| 12 Results        | 5       | 600         | 14      | 146        |
| 13 BM Hunter      | 15      | 2000        | 12      | 158        |
| 14 CLI            | 2       | 300         | 0       | 158        |
| **Total**         | **~99** | **~12,800** | **158** |            |

## Migration

Once all phases pass and BM Hunter sims match expected DPS:

1. Rename `crates/engine` → `crates/engine_old`
2. Rename `crates/engine_new` → `crates/engine`
3. Update workspace Cargo.toml
4. Delete `crates/engine_old` when confident
