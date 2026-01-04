# Issue 08: Missing Pet Ability System

## Category

Architecture Gap

## Severity

High

## Location

`src/config/sim_config.rs`, `src/sim/engine.rs`

## Description

Pets currently only auto-attack. Missing:

- Kill Command (pet ability triggered by player)
- Beast Cleave (AoE after multi-strike)
- Frenzy stacking (attack speed buff)
- Dire Beast / Call of the Wild (temporary pets)
- Pet Focus resource

## Current Pet Implementation

```rust
// PetConfig (sim_config.rs)
pub struct PetConfig {
    pub name: String,
    pub paperdoll: Paperdoll,
    pub spells: Vec<SpellDef>,    // Always empty!
    pub attack_speed: f32,
    pub attack_damage: (f32, f32),
}

// Pet damage in engine (process_pending_ticks)
while next_pet_attack <= current_time {
    let (min, max) = config.pet.attack_damage;
    let damage = pet_stats.calculate_auto_attack(min, max);
    results.total_damage += damage;
    next_pet_attack += pet_attack_ms;
}
```

## Missing Mechanics

| Mechanic         | Description                    | DPS Impact    |
| ---------------- | ------------------------------ | ------------- |
| Kill Command     | Direct pet attack, main damage | ~25%          |
| Beast Cleave     | 8s pet AoE after Multi-Shot    | ~40% AoE      |
| Frenzy           | 3 stacks, 30% attack speed     | ~8%           |
| Pet Focus        | 100 max, 10/sec regen          | Resource gate |
| Dire Beast       | Temp pet, 8s duration          | ~5%           |
| Call of the Wild | Summon 2 pets, 20s             | ~12% burst    |

## Proposed Architecture

### 1. Pet State

```rust
/// Runtime pet state during simulation
pub struct PetState {
    /// Pet type (determines abilities)
    pub pet_type: PetType,

    /// Pet's stat cache (from paperdoll)
    pub stats: PetStats,

    /// Pet's resource pool (Focus for hunters)
    pub resources: Option<ResourcePool>,

    /// Active auras on the pet
    pub auras: AuraTracker,

    /// Pet abilities with cooldowns
    pub abilities: Vec<PetAbility>,

    /// Next auto-attack time
    pub next_attack: u32,

    /// Base attack speed (modified by Frenzy)
    pub base_attack_speed: f32,

    /// Current attack speed multiplier
    pub attack_speed_mult: f32,
}

pub struct PetAbility {
    pub spell_id: u32,
    pub name: String,
    pub cooldown_ms: u32,
    pub ready_at: Option<u32>,
    pub focus_cost: f32,
    pub damage: DamageFormula,
}
```

### 2. Pet Commands

```rust
/// Commands that can be issued to pets
#[derive(Debug, Clone, Copy)]
pub enum PetCommand {
    /// Basic attack (auto or commanded)
    Attack { target_idx: usize },

    /// Cast a specific ability (Kill Command)
    CastAbility { ability_idx: usize },

    /// Apply cleave effect (Beast Cleave)
    ApplyCleave { duration_ms: u32 },
}

impl SimState {
    /// Command pet to use Kill Command
    pub fn pet_kill_command(&mut self) -> Option<f32> {
        let pet = self.pet.as_mut()?;

        // Check focus
        let cost = 30.0; // Kill Command focus cost
        if !pet.resources.as_ref()?.can_spend(cost) {
            return None;
        }

        // Check cooldown
        let kc_ability = pet.abilities.iter_mut()
            .find(|a| a.spell_id == KILL_COMMAND_PET_ID)?;

        if kc_ability.ready_at.map_or(false, |t| t > self.time) {
            return None;
        }

        // Execute
        pet.resources.as_mut()?.spend(cost);
        kc_ability.ready_at = Some(self.time + kc_ability.cooldown_ms);

        // Calculate damage
        let base = kc_ability.damage.calculate_base();
        let damage = (base + pet.stats.cache.attack_power * 0.6)
            * pet.stats.cache.crit_mult
            * pet.stats.cache.damage_multiplier;

        Some(damage)
    }
}
```

### 3. Frenzy Stacking

```rust
impl PetState {
    /// Apply Frenzy stack (from Barbed Shot)
    pub fn apply_frenzy(&mut self, current_time: u32) {
        const FRENZY_AURA_ID: usize = 0; // Slot for Frenzy
        const FRENZY_DURATION_MS: u32 = 8000;
        const FRENZY_MAX_STACKS: u8 = 3;
        const FRENZY_HASTE_PER_STACK: f32 = 0.10; // 10% per stack

        // Apply or refresh aura
        let stacks = self.auras.apply_slot(
            FRENZY_AURA_ID,
            current_time,
            FRENZY_DURATION_MS,
            FRENZY_MAX_STACKS,
        );

        // Update attack speed
        self.attack_speed_mult = 1.0 + FRENZY_HASTE_PER_STACK * stacks as f32;
    }

    /// Get current attack interval
    pub fn attack_interval_ms(&self) -> u32 {
        let base_ms = (self.base_attack_speed * 1000.0) as u32;
        (base_ms as f32 / self.attack_speed_mult) as u32
    }
}
```

### 4. Beast Cleave

```rust
/// Beast Cleave state
pub struct BeastCleaveState {
    pub active: bool,
    pub expires_at: u32,
    pub damage_percent: f32, // Usually 0.35 (35%)
}

impl PetState {
    /// Apply Beast Cleave buff (from Multi-Shot)
    pub fn apply_beast_cleave(&mut self, current_time: u32) {
        self.beast_cleave = Some(BeastCleaveState {
            active: true,
            expires_at: current_time + 4000, // 4 seconds
            damage_percent: 0.35,
        });
    }

    /// Process Beast Cleave on pet attack
    pub fn process_beast_cleave(&mut self, damage: f32, current_time: u32) -> f32 {
        let cleave = match &self.beast_cleave {
            Some(bc) if bc.active && current_time < bc.expires_at => bc,
            _ => return 0.0,
        };

        // Cleave damage to nearby targets
        damage * cleave.damage_percent
    }
}
```

### 5. Temporary Pets (Dire Beast, CotW)

```rust
/// Temporary summoned pet
pub struct SummonedPet {
    pub pet_type: PetType,
    pub stats: PetStats,
    pub expires_at: u32,
    pub next_attack: u32,
    pub attack_speed: f32,
    pub attack_damage: (f32, f32),
}

impl SimState {
    /// Summon a Dire Beast
    pub fn summon_dire_beast(&mut self, duration_ms: u32) {
        let pet = SummonedPet {
            pet_type: PetType::HunterDireBeast,
            stats: PetStats::from_owner(&self.paperdoll, 0.6), // 60% scaling
            expires_at: self.time + duration_ms,
            next_attack: self.time,
            attack_speed: 2.0,
            attack_damage: (100.0, 150.0), // Base dire beast damage
        };

        self.summoned_pets.push(pet);
    }

    /// Process all summoned pets
    pub fn process_summoned_pets(&mut self) {
        let current_time = self.time;

        // Remove expired pets
        self.summoned_pets.retain(|p| p.expires_at > current_time);

        // Process attacks
        for pet in &mut self.summoned_pets {
            while pet.next_attack <= current_time {
                let damage = pet.stats.calculate_auto_attack(
                    pet.attack_damage.0,
                    pet.attack_damage.1,
                );
                self.results.total_damage += damage;
                pet.next_attack += (pet.attack_speed * 1000.0) as u32;
            }
        }
    }
}
```

### 6. Pet Focus Resource

```rust
impl PetState {
    /// Initialize pet with Focus resource
    pub fn with_focus(mut self) -> Self {
        self.resources = Some(ResourcePool::new(
            ResourceType::Focus,
            100.0,  // Max focus
            10.0,   // Base regen (10/sec)
        ));
        self
    }

    /// Tick pet focus regeneration
    pub fn tick_focus(&mut self, dt_ms: u32, haste_mult: f32) {
        if let Some(ref mut pool) = self.resources {
            pool.tick_regen(dt_ms, haste_mult);
        }
    }
}
```

## Integration Points

### In Spell Effects

```rust
// When player casts Kill Command
SpellEffect::PetAbility { ability_id } => {
    if let Some(damage) = state.pet_kill_command() {
        state.results.total_damage += damage;
        state.results.pet_damage += damage;
    }
}

// When player casts Multi-Shot
SpellEffect::ApplyBeastCleave => {
    if let Some(ref mut pet) = state.pet {
        pet.apply_beast_cleave(state.time);
    }
}

// When player casts Barbed Shot
SpellEffect::ApplyFrenzy => {
    if let Some(ref mut pet) = state.pet {
        pet.apply_frenzy(state.time);
    }
}
```

### In Engine Loop

```rust
// In process_pending_ticks
fn process_pet_attacks(&mut self) {
    if let Some(ref mut pet) = self.pet {
        // Tick focus regen
        pet.tick_focus(dt_ms, self.paperdoll.cache.haste_mult);

        // Check Frenzy expiry
        pet.check_aura_expiry(self.time);

        // Process auto-attacks
        let attack_interval = pet.attack_interval_ms();
        while pet.next_attack <= self.time {
            let damage = pet.stats.calculate_auto_attack(...);

            // Beast Cleave
            let cleave = pet.process_beast_cleave(damage, self.time);
            if cleave > 0.0 {
                // Apply to nearby targets
                self.results.total_damage += cleave;
            }

            self.results.total_damage += damage;
            pet.next_attack += attack_interval;
        }
    }

    // Process temporary pets
    self.process_summoned_pets();
}
```

## Impact

- Enables accurate pet damage simulation (~40% of BM DPS)
- Foundation for all pet-based specs
- Proper Frenzy/Beast Cleave mechanics

## Effort

High (16-24 hours)

## Tests Required

- Kill Command damage calculation
- Frenzy stacking and expiry
- Beast Cleave activation and damage
- Dire Beast lifecycle
- Pet Focus regeneration
