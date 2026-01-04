# Issue 10: No Mastery Formula Differentiation

## Category

Architecture Gap

## Severity

Medium

## Location

`src/paperdoll/paperdoll.rs:616`

## Description

All specs use the same mastery calculation: `mastery_value = mastery_pct * coefficient`. However, different specs have fundamentally different mastery effects that aren't just multipliers.

## Current Code

```rust
// paperdoll.rs:616
self.cache.mastery_value = mastery_pct * coeff.mastery_coefficient;
```

## Mastery Types in WoW

| Type              | Example               | Formula              | Current Support |
| ----------------- | --------------------- | -------------------- | --------------- |
| Simple Multiplier | BM Master of Beasts   | +X% pet damage       | Partial         |
| Additive Damage   | Fire Ignite           | +X% to Ignite        | No              |
| Proc Chance       | Frost Icicles         | +X% to proc          | No              |
| Stacking Effect   | Outlaw Roll the Bones | +X per combo         | No              |
| Threshold         | Prot Block Value      | Complex DR           | No              |
| Split             | Enh Ele/Phys          | Two separate bonuses | No              |

## Examples of Complex Masteries

### Beast Mastery: Master of Beasts

```
Pet damage increased by 18% + (Mastery × 1.0)%
```

- Simple multiplier to pet damage
- Current system can handle this

### Fire Mage: Ignite

```
Ignite deals 18% + (Mastery × 0.75)% of spell damage as DoT
Spreading Ignite spreads to nearby enemies
```

- Creates a DoT based on spell damage
- DoT spreads to targets
- Current system cannot handle

### Frost Mage: Icicles

```
Ice Lance and Frostbolt have 12% + (Mastery × 2.25)% chance to generate Icicle
Icicles deal damage when Ice Lance hits frozen target
```

- Proc chance that scales with mastery
- Resource-like icicle storage
- Current system cannot handle

### Enhancement Shaman: Enhanced Elements

```
Fire/Frost/Nature damage increased by 16% + (Mastery × 2.0)%
```

- Damage increase to specific schools
- Current system lacks school filtering

## Proposed Solution

### 1. Mastery Effect Enum

```rust
/// How a spec's mastery affects gameplay
#[derive(Debug, Clone)]
pub enum MasteryEffect {
    /// Simple percentage multiplier to a stat
    StatMultiplier {
        stat: MasteryStat,
        base_percent: f32,
        per_mastery: f32,
    },

    /// Percentage multiplier to specific damage source
    DamageMultiplier {
        source: DamageSource,
        base_percent: f32,
        per_mastery: f32,
    },

    /// School-specific damage multiplier
    SchoolDamageMultiplier {
        schools: Vec<DamageSchool>,
        base_percent: f32,
        per_mastery: f32,
    },

    /// Proc chance that scales with mastery
    ProcChance {
        trigger: ProcTrigger,
        effect_id: u32,
        base_chance: f32,
        per_mastery: f32,
    },

    /// Special effect with custom formula (scripted)
    Custom {
        effect_id: String,
        base_value: f32,
        per_mastery: f32,
    },
}

#[derive(Debug, Clone, Copy)]
pub enum MasteryStat {
    PetDamage,
    CritChance,
    HealingDone,
    DamageDone,
    BlockValue,
    ShieldValue,
}

#[derive(Debug, Clone, Copy)]
pub enum DamageSource {
    AllSpells,
    DirectSpells,
    DoTs,
    PetDamage,
    AutoAttacks,
}
```

### 2. Spec Mastery Configuration

```rust
impl ClassCoefficients {
    pub fn beast_mastery() -> Self {
        Self {
            // ... other fields
            mastery_effect: MasteryEffect::DamageMultiplier {
                source: DamageSource::PetDamage,
                base_percent: 18.0,
                per_mastery: 1.0,
            },
        }
    }

    pub fn fire() -> Self {
        Self {
            mastery_effect: MasteryEffect::Custom {
                effect_id: "ignite".into(),
                base_value: 18.0,
                per_mastery: 0.75,
            },
        }
    }

    pub fn frost_mage() -> Self {
        Self {
            mastery_effect: MasteryEffect::ProcChance {
                trigger: ProcTrigger::OnSpellCast { spell_id: None },
                effect_id: ICICLE_ID,
                base_chance: 0.12,
                per_mastery: 0.0225,
            },
        }
    }
}
```

### 3. Mastery Application in Engine

```rust
impl SimState {
    /// Get mastery multiplier for a damage source
    pub fn mastery_multiplier(&self, source: DamageSource) -> f32 {
        match &self.mastery_effect {
            MasteryEffect::DamageMultiplier {
                source: effect_source,
                base_percent,
                per_mastery
            } => {
                if *effect_source == source || *effect_source == DamageSource::AllSpells {
                    1.0 + (base_percent + per_mastery * self.mastery_rating_value) / 100.0
                } else {
                    1.0
                }
            }
            _ => 1.0,
        }
    }

    /// Check mastery proc
    pub fn check_mastery_proc(&mut self, trigger: ProcTrigger) -> Option<u32> {
        match &self.mastery_effect {
            MasteryEffect::ProcChance {
                trigger: proc_trigger,
                effect_id,
                base_chance,
                per_mastery,
            } => {
                if *proc_trigger == trigger {
                    let chance = base_chance + per_mastery * self.mastery_rating_value;
                    if self.rng.gen_f32() < chance {
                        return Some(*effect_id);
                    }
                }
                None
            }
            _ => None,
        }
    }
}
```

### 4. Updated Damage Calculation

```rust
fn calculate_damage_inline(&self, spell_idx: usize) -> f32 {
    let base = /* ... */;
    let ap_damage = /* ... */;

    let total = (base + ap_damage)
        * self.cache.crit_mult
        * self.cache.damage_multiplier
        * self.mastery_multiplier(DamageSource::DirectSpells);  // NEW

    total
}

fn calculate_pet_damage(&self, min: f32, max: f32) -> f32 {
    let base = (min + max) * 0.5;
    let ap_damage = self.pet_stats.cache.attack_power * 0.333;

    let total = (base + ap_damage)
        * self.pet_stats.cache.crit_mult
        * self.pet_stats.cache.damage_multiplier
        * self.mastery_multiplier(DamageSource::PetDamage);  // NEW

    total
}
```

## TOML Configuration

```toml
[spec.mastery]
type = "damage_multiplier"
source = "pet_damage"
base_percent = 18.0
per_mastery = 1.0
```

## Impact

- Accurate mastery scaling per spec
- Foundation for all 38 specs
- Clear separation of mastery types

## Effort

Medium (6-10 hours)

## Tests Required

- Test each mastery effect type
- Verify BM pet damage scales with mastery
- Verify Fire ignite scales correctly
- Verify Frost icicle proc rate
