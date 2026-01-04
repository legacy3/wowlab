# Beast Master Hunter - Gap Analysis

Comparison of wowlab simulation engine vs SimulationCraft for BM Hunter support.

**Date:** 2026-01-04

---

## Current Engine State

### Implemented

| Feature                 | Status | Notes                                                                                                    |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Core spell definitions  | ✅     | Kill Command, Barbed Shot, Cobra Shot, Multi-Shot, Bestial Wrath, Call of the Wild, Kill Shot, Bloodshed |
| Resource system (Focus) | ✅     | 100 max, 10/s regen, lazy evaluation                                                                     |
| Cooldown tracking       | ✅     | Regular + charge-based (Barbed Shot 2 charges)                                                           |
| Basic aura/buff system  | ✅     | 32 slots, O(1) lookup, DoT ticking                                                                       |
| Damage calculation      | ✅     | Base + AP scaling, crit expected value, versatility                                                      |
| Event queue             | ✅     | O(1) timing wheel (~120M events/sec)                                                                     |
| Rotation scripting      | ✅     | Rhai-based DSL with predictive gating                                                                    |

### Partially Implemented

| Feature          | Gap                                             |
| ---------------- | ----------------------------------------------- |
| Pet auto-attacks | Basic damage only, no talent synergies          |
| Frenzy buff      | Defined but no proper stacking from Barbed Shot |
| Beast Cleave     | Defined but not applied to pet                  |

---

## Critical Missing Features

### 1. Pet System (BM's Core Mechanic)

SimulationCraft has a complete pet hierarchy:

**Pet Stats Inheritance:**
| Pet Type | AP from Owner | Notes |
|----------|---------------|-------|
| Main Pet | 60% | Standard stable pet |
| Animal Companion | 60% | Passive pet (talent) |
| Dire Beast | 100% | Full AP scaling |
| Call of the Wild Pet | 60% | Dynamic summon |
| Fenryr/Hati | 200% | Special summons |

**Pet Actions:**

- Kill Command pet attack (`kill_command_bm_t`)
- Basic attacks (Claw/Bite/Smack)
- Beast Cleave AoE on melee hits
- Bestial Wrath pet damage buff

**Pet Resources:**

- Pet Focus pool (100 base)
- Pet Focus regen = 125% of owner's regen

**Multi-Pet Handling:**

```cpp
struct pets_t {
  hunter_main_pet_t* main;
  animal_companion_t* animal_companion;
  spawner::pet_spawner_t<dire_beast_t> dire_beast;
  spawner::pet_spawner_t<call_of_the_wild_pet_t> cotw_stable_pet;
};
```

**wowlab status:** Only basic pet auto-attack damage, no pet abilities or multi-pet support

---

### 2. Beast Cleave Mechanics

**SimC Implementation:**

```cpp
struct beast_cleave_attack_t: public hunter_pet_attack_t {
  // Triggered by pet melee hits when buff is active
  // Damage = result_total * buff_value to all nearby enemies
  // Applied by Multi-Shot, Bloody Frenzy, Call of the Wild
};
```

**Trigger conditions:**

1. Action must hit
2. Multiple enemies present (active_enemies > 1)
3. Beast Cleave buff active on pet
4. Pet has beast_cleave action

**wowlab status:** Not implemented

---

### 3. Barbed Shot Stack System

SimC uses 5 independent ticking buffs:

```cpp
std::array<buff_t*, BARBED_SHOT_BUFFS_MAX> barbed_shot;
// Each stack: 20 Focus regeneration per tick
// Duration: Based on talent
```

**Effects per Barbed Shot cast:**

- Applies Frenzy to pet (stacking attack speed buff)
- Triggers Thrill of the Hunt
- Reduces Bestial Wrath cooldown (Barbed Wrath talent)
- Can reset Kill Command (War Orders talent)

**Stack management:**

```cpp
// Find first inactive buff slot and trigger it
auto it = range::find_if(p()->buffs.barbed_shot, [](buff_t* b) { return !b->check(); });
if (it != p()->buffs.barbed_shot.end())
  (*it)->trigger();
```

**wowlab status:** Single Frenzy aura, no multi-stack independent tracking

---

### 4. Proc System

SimC has extensive proc infrastructure:

**Proc Types:**

- `simple_proc_t` - Flat percentage chance
- `real_ppm_t` - Real PPM with bad luck protection
- Internal cooldown (ICD) tracking
- Triggers on spell cast/hit/crit/damage

**Key BM Procs:**
| Proc | Trigger | Effect |
|------|---------|--------|
| Wild Call | Auto-attack crit | Reset Barbed Shot charge |
| War Orders | Barbed Shot | Chance to reset Kill Command |
| Killer Cobra | Cobra Shot during BW | Reset Kill Command CD |
| Go for the Throat | Pet crit | Reduce Kill Command CD |

**wowlab status:** `ProcTrigger` enum exists but zero implementation

---

### 5. Cooldown Reduction Interactions

| Interaction       | Source   | Effect                                     | SimC | wowlab |
| ----------------- | -------- | ------------------------------------------ | ---- | ------ |
| Cobra Shot        | Baseline | Kill Command -0.5s                         | ✅   | ❌     |
| Barbed Wrath      | Talent   | Bestial Wrath CD reduction per Barbed Shot | ✅   | ❌     |
| Master Handler    | Talent   | Kill Command -0.5s per Barbed Shot tick    | ✅   | ❌     |
| Go for the Throat | Talent   | Kill Command CD on crit                    | ✅   | ❌     |
| Barbed Scales     | Talent   | Barbed Shot CD reduction on Cobra Shot     | ✅   | ❌     |

---

### 6. Action Snapshotting

**SimC `action_state_t`:**

```cpp
struct action_state_t {
  // Snapshotted stats at cast time
  double haste, crit_chance;
  double attack_power, spell_power;
  double versatility;

  // Result tracking
  result_e result;  // HIT, CRIT, MISS, etc.
  double result_total, result_mitigated;

  // Multipliers
  double da_multiplier, ta_multiplier;
  double player_multiplier, pet_multiplier;
};
```

**wowlab status:** All calculations use current stats, no snapshot support

---

### 7. Multi-Target / AoE

**Missing:**

- Target list iteration
- AoE target caps
- Chain targeting
- Cleave mechanics
- Reduced AoE damage scaling

---

## SimC BM Hunter File Reference

| Component    | File             | Lines     |
| ------------ | ---------------- | --------- |
| Core Hunter  | `sc_hunter.cpp`  | 395-1000  |
| BM Abilities | `sc_hunter.cpp`  | 5200-7400 |
| Pet System   | `sc_hunter.cpp`  | 1705-3500 |
| Buffs Setup  | `sc_hunter.cpp`  | 8700-9100 |
| APL Code     | `apl_hunter.cpp` | 55-216    |

---

## Priority Implementation List

### High Priority (Core BM Functionality)

```
Pet System Foundation
├── Pet stats inheritance from owner (60% AP)
├── Pet actions (Kill Command attack)
├── Pet focus resource (125% owner regen)
└── Multi-pet spawning
    ├── Animal Companion (passive second pet)
    ├── Dire Beast (temporary summon)
    └── Call of the Wild pets

Beast Cleave Implementation
├── Buff application from Multi-Shot
├── Pet melee trigger check
├── AoE damage to nearby enemies
└── Target exclusion (not primary)

Barbed Shot Multi-Stack System
├── 5 independent buff slots
├── Per-stack Focus regeneration
├── Pet Frenzy application
└── Stack tracking and refresh

Proc System
├── Proc infrastructure (chance, ICD, trigger)
├── Wild Call implementation
├── War Orders implementation
└── Killer Cobra implementation

Cooldown Reduction Effects
├── Cobra Shot → Kill Command
├── Barbed Wrath → Bestial Wrath
└── Master Handler → Kill Command
```

### Medium Priority (Accuracy)

```
├── Frenzy stacking (pet attack speed increase)
├── Thrill of the Hunt buff
├── Kill Command cooldown interactions
├── Bestial Wrath damage amp to pets
├── Action snapshotting for DoTs
└── Mastery: Master of Beasts implementation
```

### Lower Priority (Completeness)

```
├── Call of the Wild full implementation
├── Dire Beast duration/attack calculations
├── Bloodshed pet bleed mechanic
├── Tier set effects (TWW S1/S2)
├── Hero talents (Pack Leader)
├── Hero talents (Dark Ranger)
└── Trinket/external buff interactions
```

---

## Damage Contribution Estimates

Based on typical BM Hunter damage breakdown:

| Source             | % of Total | Implementation Status         |
| ------------------ | ---------- | ----------------------------- |
| Pet auto-attacks   | ~15%       | ⚠️ Basic only                 |
| Kill Command       | ~25%       | ⚠️ Player only, no pet attack |
| Barbed Shot        | ~10%       | ⚠️ No Focus regen             |
| Cobra Shot         | ~15%       | ✅ Works                      |
| Beast Cleave (AoE) | ~10-30%    | ❌ Missing                    |
| Bestial Wrath amp  | ~10%       | ❌ Missing                    |
| Procs/Talents      | ~15%       | ❌ Missing                    |

**Current estimated accuracy:** ~30-40% of actual DPS

---

## Recommended Implementation Order

1. **Pet System Foundation** - Highest impact, ~40% of BM damage comes from pets
2. **Proc System** - Required for talent interactions
3. **Cooldown Reductions** - Key rotational interactions
4. **Beast Cleave** - Core AoE mechanic
5. **Barbed Shot Stacks** - Focus regeneration accuracy

---

## Architecture Notes

### SimC Pet Hierarchy

```
pet_t (base)
├── hunter_pet_t
│   ├── stable_pet_t
│   │   ├── hunter_main_pet_base_t
│   │   │   └── hunter_main_pet_t
│   │   ├── call_of_the_wild_pet_t
│   │   └── dire_critter_t
│   └── dark_hound_t
```

### Suggested wowlab Pet Structure

```rust
pub struct PetState {
    pub stats: PetStats,
    pub resources: Resources,  // Pet focus
    pub auras: AuraTracker,
    pub next_attack: u32,
    pub attack_speed_ms: u32,
}

pub struct PetStats {
    pub attack_power: f32,     // Inherited from owner
    pub crit_chance: f32,
    pub haste_mult: f32,
}

pub enum PetType {
    MainPet,
    AnimalCompanion,
    DireBeast { expires: u32 },
    CallOfTheWild { expires: u32 },
}
```

### Suggested Proc Structure

```rust
pub struct ProcDef {
    pub trigger: ProcTrigger,
    pub chance: f32,
    pub icd_ms: u32,
    pub effect: ProcEffect,
}

pub enum ProcTrigger {
    OnSpellCast { spell_id: u32 },
    OnSpellHit { spell_id: u32 },
    OnSpellCrit { spell_id: u32 },
    OnPetCrit,
    OnAutoAttackCrit,
}

pub enum ProcEffect {
    ResetCooldown { spell_idx: u8 },
    ReduceCooldown { spell_idx: u8, amount_ms: u32 },
    TriggerSpell { spell_idx: u8 },
    ApplyAura { aura_idx: u8 },
}
```
