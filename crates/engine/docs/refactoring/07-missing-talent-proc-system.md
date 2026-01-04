# Issue 07: Missing Trait/Proc System

**Status: RESOLVED**

## Category

Architecture Gap

## Severity

Critical (now resolved)

## Location

Multiple files - system not implemented

## Description

The engine has no infrastructure for:

- Talent selection/loadouts
- Proc triggers (on crit, on hit, on cast)
- Cooldown reduction mechanics
- Conditional spell interactions

This limits BM Hunter accuracy to ~40% of actual DPS.

## Current State

```rust
// ProcTrigger defined but unused (config/aura_def.rs)
pub enum ProcTrigger {
    OnSpellCast,
    OnSpellHit,
    OnSpellCrit,
    OnMeleeHit,
    OnMeleeCrit,
    OnDamageTaken,
    OnHeal,
}

// AuraEffect::Proc defined but never processed
Proc { trigger: ProcTrigger, spell_id: u32, chance: f32, icd: f32 },
```

## Missing Mechanics (BM Hunter Example)

| Mechanic      | Description                            | DPS Impact |
| ------------- | -------------------------------------- | ---------- |
| Wild Call     | Auto-attack crit resets Barbed Shot    | ~8%        |
| War Orders    | Barbed Shot 25% reset Kill Command     | ~5%        |
| Barbed Wrath  | Barbed Shot reduces Bestial Wrath CD   | ~3%        |
| Cobra Shot CD | Cobra Shot reduces Kill Command by 1s  | ~10%       |
| Beast Cleave  | Multi-Strike on pet after Kill Command | ~15% AoE   |

## Proposed Architecture

### 1. Talent Definition

```rust
/// A talent that can be selected in a loadout
#[derive(Debug, Clone)]
pub struct TalentDefinition {
    pub id: u32,
    pub name: String,
    pub spec_requirements: Vec<SpecId>,
    pub row: u8,
    pub column: u8,
    pub max_ranks: u8,
    pub effects: Vec<TalentEffect>,
}

/// Effects a talent can have
#[derive(Debug, Clone)]
pub enum TalentEffect {
    /// Grant a passive aura while talented
    GrantAura { aura_id: u32 },

    /// Modify a spell's properties
    ModifySpell {
        spell_id: u32,
        modification: SpellModification,
    },

    /// Add a proc effect
    AddProc {
        trigger: ProcTrigger,
        effect: ProcEffect,
        chance: f32,
        icd_ms: u32,
    },

    /// Unlock a spell
    LearnSpell { spell_id: u32 },
}

#[derive(Debug, Clone)]
pub enum SpellModification {
    CooldownReduction { amount_ms: i32 },
    DamageIncrease { percent: f32 },
    CostReduction { amount: f32 },
    AddEffect { effect: SpellEffect },
}
```

### 2. Proc System

```rust
/// Proc trigger conditions
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProcTrigger {
    OnSpellCast { spell_id: Option<u32> },
    OnSpellHit { spell_id: Option<u32> },
    OnSpellCrit { spell_id: Option<u32> },
    OnAutoAttackHit,
    OnAutoAttackCrit,
    OnPetAttackHit,
    OnPetAttackCrit,
    OnDamageTaken,
    OnKill,
}

/// What happens when a proc triggers
#[derive(Debug, Clone)]
pub enum ProcEffect {
    /// Reset a spell's cooldown
    ResetCooldown { spell_id: u32 },

    /// Reduce a spell's remaining cooldown
    ReduceCooldown { spell_id: u32, amount_ms: u32 },

    /// Grant a charge of a spell
    GrantCharge { spell_id: u32 },

    /// Apply an aura
    ApplyAura { aura_id: u32 },

    /// Trigger another spell
    TriggerSpell { spell_id: u32 },

    /// Grant resource
    Energize { resource: ResourceType, amount: f32 },
}

/// Runtime proc tracker
pub struct ProcTracker {
    /// Active procs indexed by trigger type
    procs: Vec<ActiveProc>,
}

pub struct ActiveProc {
    pub trigger: ProcTrigger,
    pub effect: ProcEffect,
    pub chance: f32,          // 0.0-1.0
    pub icd_ms: u32,          // Internal cooldown
    pub last_proc_time: u32,  // For ICD tracking
}

impl ProcTracker {
    /// Check and trigger procs for a given event
    pub fn check_procs(
        &mut self,
        trigger: ProcTrigger,
        current_time: u32,
        rng: &mut FastRng,
    ) -> Vec<ProcEffect> {
        let mut triggered = Vec::new();

        for proc in &mut self.procs {
            if proc.trigger != trigger {
                continue;
            }

            // Check ICD
            if current_time < proc.last_proc_time + proc.icd_ms {
                continue;
            }

            // Roll chance
            if rng.gen_f32() < proc.chance {
                proc.last_proc_time = current_time;
                triggered.push(proc.effect.clone());
            }
        }

        triggered
    }
}
```

### 3. Cooldown Reduction System

```rust
impl SpellState {
    /// Reduce remaining cooldown by amount
    pub fn reduce_cooldown(&mut self, amount_ms: u32) {
        if let Some(ready_at) = self.ready_at {
            self.ready_at = Some(ready_at.saturating_sub(amount_ms));
        }
    }

    /// Reset cooldown entirely
    pub fn reset_cooldown(&mut self) {
        self.ready_at = None;
        if self.current_charges < self.max_charges {
            self.current_charges += 1;
        }
    }
}
```

### 4. Integration in Engine

```rust
// In engine.rs after damage is dealt
fn process_damage_procs(
    &mut self,
    spell_idx: usize,
    was_crit: bool,
    source: DamageSource,
) {
    let trigger = match (source, was_crit) {
        (DamageSource::Spell, true) => ProcTrigger::OnSpellCrit { spell_id: Some(spell_id) },
        (DamageSource::Spell, false) => ProcTrigger::OnSpellHit { spell_id: Some(spell_id) },
        (DamageSource::AutoAttack, true) => ProcTrigger::OnAutoAttackCrit,
        (DamageSource::AutoAttack, false) => ProcTrigger::OnAutoAttackHit,
        (DamageSource::Pet, true) => ProcTrigger::OnPetAttackCrit,
        (DamageSource::Pet, false) => ProcTrigger::OnPetAttackHit,
    };

    let effects = self.proc_tracker.check_procs(trigger, self.time, &mut self.rng);

    for effect in effects {
        self.apply_proc_effect(effect);
    }
}

fn apply_proc_effect(&mut self, effect: ProcEffect) {
    match effect {
        ProcEffect::ResetCooldown { spell_id } => {
            if let Some(idx) = self.spell_id_to_idx(spell_id) {
                self.player.spell_states[idx].reset_cooldown();
            }
        }
        ProcEffect::ReduceCooldown { spell_id, amount_ms } => {
            if let Some(idx) = self.spell_id_to_idx(spell_id) {
                self.player.spell_states[idx].reduce_cooldown(amount_ms);
            }
        }
        ProcEffect::GrantCharge { spell_id } => {
            if let Some(idx) = self.spell_id_to_idx(spell_id) {
                self.player.spell_states[idx].grant_charge();
            }
        }
        ProcEffect::ApplyAura { aura_id } => {
            self.apply_aura(aura_id);
        }
        ProcEffect::TriggerSpell { spell_id } => {
            self.queue_spell_cast(spell_id);
        }
        ProcEffect::Energize { resource, amount } => {
            self.player.resources.gain(resource, amount);
        }
    }
}
```

### 5. Talent Loadout

```rust
/// Selected talents for a simulation
#[derive(Debug, Clone)]
pub struct TalentLoadout {
    pub spec: SpecId,
    pub talents: HashMap<u32, u8>, // talent_id -> ranks
}

impl TalentLoadout {
    /// Build proc tracker from selected talents
    pub fn build_procs(&self, talent_db: &TalentDatabase) -> ProcTracker {
        let mut procs = Vec::new();

        for (&talent_id, &ranks) in &self.talents {
            if let Some(talent) = talent_db.get(talent_id) {
                for effect in &talent.effects {
                    if let TalentEffect::AddProc { trigger, effect, chance, icd_ms } = effect {
                        procs.push(ActiveProc {
                            trigger: *trigger,
                            effect: effect.clone(),
                            chance: *chance * ranks as f32, // Scale with ranks
                            icd_ms: *icd_ms,
                            last_proc_time: 0,
                        });
                    }
                }
            }
        }

        ProcTracker { procs }
    }
}
```

## Example: Wild Call Implementation

```rust
// In talent definitions
TalentDefinition {
    id: 185789,
    name: "Wild Call".into(),
    spec_requirements: vec![SpecId::BeastMastery],
    row: 2,
    column: 1,
    max_ranks: 1,
    effects: vec![
        TalentEffect::AddProc {
            trigger: ProcTrigger::OnAutoAttackCrit,
            effect: ProcEffect::ResetCooldown { spell_id: BARBED_SHOT_ID },
            chance: 0.20, // 20% chance
            icd_ms: 500,  // 0.5s ICD
        },
    ],
}
```

## Impact

- Enables 40%→80%+ accuracy for BM Hunter
- Foundation for all spec talent trees
- Proper proc-based gameplay simulation

## Effort

High (16-24 hours)

## Tests Required

- Unit tests for proc chance/ICD
- Integration test: Wild Call procs on auto crit
- Integration test: Cobra Shot reduces KC cooldown
- Verify proc rate matches expected (statistical)

## Resolution

Implemented in `crates/engine/src/traits/` module:

### Files Created

- `traits/mod.rs` - Module exports
- `traits/types.rs` - `TraitDefinition`, `TraitEffect`, `SpellModification`, `TraitTree`
- `traits/proc.rs` - `ProcTracker`, `ProcTrigger`, `ProcEffect`, `ActiveProc`
- `traits/parser.rs` - Base64 trait string parser (`parse_trait_string`, `TraitLoadout`)

### Key Types

```rust
// Proc triggers (what causes a proc)
pub enum ProcTrigger {
    OnSpellCast, OnSpellCastId { spell_id: u32 },
    OnSpellHit, OnSpellHitId { spell_id: u32 },
    OnSpellCrit, OnSpellCritId { spell_id: u32 },
    OnAutoAttackHit, OnAutoAttackCrit,
    OnPetAttackHit, OnPetAttackCrit,
    OnDamageTaken, OnKill,
    OnAuraApply { aura_id: u32 }, OnAuraExpire { aura_id: u32 },
}

// Proc effects (what happens when a proc triggers)
pub enum ProcEffect {
    ResetCooldown { spell_id: u32 },
    ReduceCooldown { spell_id: u32, amount_ms: u32 },
    GrantCharge { spell_id: u32 },
    ApplyAura { aura_id: u32 },
    RemoveAura { aura_id: u32 },
    TriggerSpell { spell_id: u32 },
    Energize { amount: f32 },
    Damage { base: f32, ap_coeff: f32 },
}
```

### Integration Points

1. **SimState** - Added `proc_tracker: ProcTracker` field
2. **Engine** - Proc checking after spell damage, auto-attacks, and pet attacks
3. **TOML Config** - Added `traits` field to `SpecMeta` for trait string input

### Tests Added

- `test_proc_trigger_match` - Generic/specific trigger matching
- `test_proc_icd` - Internal cooldown tracking
- `test_proc_tracker` - Full proc flow (trigger → ICD → re-trigger)
- `test_bit_reader` - Base64 bit stream parsing
- `test_base64_decode` - Standard base64 decoding
