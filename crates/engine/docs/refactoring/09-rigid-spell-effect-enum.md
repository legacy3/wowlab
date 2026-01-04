# Issue 09: Rigid SpellEffect Enum

## Category

Architecture Gap

## Severity

High

## Location

`src/config/spell_def.rs`

## Description

The `SpellEffect` enum can only express a fixed set of effects. Many common WoW mechanics require effects that don't fit the current variants.

## Current Definition

```rust
pub enum SpellEffect {
    Damage { formula: DamageFormula },
    ApplyAura { aura_id: u32, duration: f32 },
    Heal { formula: DamageFormula },
    Energize { resource_type: ResourceType, amount: f32 },
    Summon { unit_id: u32, duration: f32 },
    TriggerSpell { spell_id: u32 },
}
```

## Cannot Express

| Mechanic        | Description                     | Example                           |
| --------------- | ------------------------------- | --------------------------------- |
| CD Reduction    | Reduce another spell's cooldown | Cobra Shot → Kill Command         |
| Aura to Pet     | Apply aura to pet not player    | Frenzy on pet                     |
| Conditional     | Effect only if condition met    | Barbed Shot resets with Wild Call |
| Stacking Regen  | Resource per aura stack         | Barbed Shot Focus regen           |
| Extend Duration | Add time to existing aura       | Pandemic refreshing               |
| Snapshot        | Lock stats at cast time         | DoT snapshotting                  |
| Chain Effect    | One effect triggers another     | Kill Shot → Flayed Shot           |

## Proposed Expansion

### Option A: Extend Enum (Simpler)

```rust
pub enum SpellEffect {
    // ===== Existing =====
    Damage { formula: DamageFormula },
    ApplyAura { aura_id: u32, duration_ms: u32 },
    Heal { formula: DamageFormula },
    Energize { resource_type: ResourceType, amount: f32 },
    Summon { unit_id: u32, duration_ms: u32 },
    TriggerSpell { spell_id: u32 },

    // ===== New: Targeting =====
    /// Apply aura to a specific target type
    ApplyAuraToTarget {
        aura_id: u32,
        duration_ms: u32,
        target: EffectTarget,
    },

    // ===== New: Cooldown Manipulation =====
    /// Reduce remaining cooldown of a spell
    ReduceCooldown {
        spell_id: u32,
        amount_ms: u32,
    },

    /// Reset a spell's cooldown entirely
    ResetCooldown {
        spell_id: u32,
    },

    /// Grant a charge of a spell
    GrantCharge {
        spell_id: u32,
    },

    // ===== New: Resource Effects =====
    /// Grant resource per active aura stack
    EnergizePerStack {
        resource_type: ResourceType,
        amount_per_stack: f32,
        aura_id: u32,
    },

    /// Modify resource regeneration
    ModifyResourceRegen {
        resource_type: ResourceType,
        flat_bonus: f32,
        percent_bonus: f32,
    },

    // ===== New: Aura Manipulation =====
    /// Extend an existing aura's duration
    ExtendAura {
        aura_id: u32,
        amount_ms: u32,
        max_ms: u32,  // Cap for pandemic
    },

    /// Consume aura stacks
    ConsumeStacks {
        aura_id: u32,
        count: u8,
    },

    // ===== New: Pet Commands =====
    /// Command pet to use an ability
    PetAbility {
        ability_id: u32,
    },

    /// Apply effect to pet
    PetEffect {
        effect: Box<SpellEffect>,
    },

    // ===== New: Conditional =====
    /// Effect only triggers if condition is met
    Conditional {
        condition: EffectCondition,
        effect: Box<SpellEffect>,
    },
}

#[derive(Debug, Clone, Copy)]
pub enum EffectTarget {
    Self_,
    Pet,
    Target,
    AllEnemies,
    AllAllies,
}

#[derive(Debug, Clone)]
pub enum EffectCondition {
    AuraActive { aura_id: u32 },
    AuraStacks { aura_id: u32, min: u8 },
    ResourceAbove { resource: ResourceType, amount: f32 },
    ResourceBelow { resource: ResourceType, amount: f32 },
    HealthBelow { percent: f32 },
    Random { chance: f32 },
}
```

### Option B: Trait-Based Effects (More Flexible)

```rust
/// Base trait for all spell effects
pub trait SpellEffectHandler: Send + Sync {
    /// Execute the effect
    fn execute(&self, ctx: &mut EffectContext) -> EffectResult;

    /// Clone into boxed trait object
    fn clone_box(&self) -> Box<dyn SpellEffectHandler>;
}

/// Context available during effect execution
pub struct EffectContext<'a> {
    pub state: &'a mut SimState,
    pub caster: EntityRef,
    pub target: EntityRef,
    pub spell: &'a SpellDef,
}

/// Result of effect execution
pub struct EffectResult {
    pub damage_dealt: f32,
    pub healing_done: f32,
    pub triggered_events: Vec<SimEvent>,
}

// Example implementations
pub struct DamageEffect {
    pub formula: DamageFormula,
}

impl SpellEffectHandler for DamageEffect {
    fn execute(&self, ctx: &mut EffectContext) -> EffectResult {
        let damage = self.formula.calculate(ctx.state);
        ctx.state.apply_damage(ctx.target, damage);
        EffectResult { damage_dealt: damage, ..Default::default() }
    }
}

pub struct ReduceCooldownEffect {
    pub spell_id: u32,
    pub amount_ms: u32,
}

impl SpellEffectHandler for ReduceCooldownEffect {
    fn execute(&self, ctx: &mut EffectContext) -> EffectResult {
        if let Some(idx) = ctx.state.spell_idx(self.spell_id) {
            ctx.state.player.spell_states[idx].reduce_cooldown(self.amount_ms);
        }
        EffectResult::default()
    }
}

// Usage in SpellDef
pub struct SpellDef {
    pub id: u32,
    pub name: String,
    pub effects: Vec<Box<dyn SpellEffectHandler>>,
    // ...
}
```

### Option C: Effect Script (Most Flexible)

```rust
/// Effects defined as mini-scripts
pub struct ScriptedEffect {
    pub script: String,  // Rhai script
}

// Example scripts
const COBRA_SHOT_EFFECT: &str = r#"
    deal_damage(spell.damage);
    reduce_cooldown("Kill Command", 1000);
    if has_aura("Aspect of the Wild") {
        reduce_cooldown("Kill Command", 500);
    }
"#;

const BARBED_SHOT_EFFECT: &str = r#"
    deal_damage(spell.damage);
    apply_aura_to(pet, "Frenzy", 8000);

    let stacks = get_stacks("Frenzy");
    energize("Focus", 5 * stacks);
"#;
```

## Recommendation

**Option A** is recommended for now:

- Adds needed variants without major refactor
- Maintains type safety
- Can evolve to Option B/C later

## Impact

- Enables complex spell interactions
- Foundation for talent effects
- Better TOML expressiveness

## Effort

Medium (8-12 hours for Option A)

## Tests Required

- Unit test each new effect variant
- Integration test: Cobra Shot reduces KC CD
- Integration test: Barbed Shot applies pet Frenzy
