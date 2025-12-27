# Rust Engine Implementation Plan

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TYPESCRIPT / EFFECT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Supabase ─────► Spell Data ─────┐                                         │
│                                  │                                          │
│  Supabase ─────► Aura Data ──────┼───► SimConfig (JSON)                    │
│                                  │           │                              │
│  Talents ──────► Stat Mods ──────┤           │                              │
│                                  │           ▼                              │
│  Gear ─────────► Player Stats ───┘     ┌──────────┐                        │
│                                        │   WASM   │                        │
│  Rotation ─────► Priority List ───────►│  Engine  │───► Results (JSON)    │
│                                        └──────────┘           │             │
│                                                               ▼             │
│                                                         ┌──────────┐       │
│                                                         │ Display  │       │
│                                                         │ Aggregate│       │
│                                                         └──────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Input: SimConfig

```rust
struct SimConfig {
    // Player
    player: PlayerConfig,
    pet: Option<PetConfig>,

    // Spells & Auras (from Supabase)
    spells: Vec<SpellDef>,
    auras: Vec<AuraDef>,

    // Rotation (priority list)
    rotation: Vec<RotationAction>,

    // Simulation settings
    duration: f32,
    iterations: u32,

    // Target
    target: TargetConfig,
}

struct PlayerConfig {
    stats: Stats,
    resources: ResourceConfig,
    spec: SpecId,
}

struct Stats {
    intellect: f32,
    agility: f32,
    stamina: f32,
    crit: f32,
    haste: f32,
    mastery: f32,
    versatility: f32,
}

struct SpellDef {
    id: u32,
    name: String,
    cooldown: f32,
    charges: u8,
    gcd: f32,
    cast_time: f32,
    cost: ResourceCost,
    damage: DamageFormula,
    effects: Vec<SpellEffect>,
}

struct AuraDef {
    id: u32,
    duration: f32,
    max_stacks: u8,
    effects: Vec<AuraEffect>,
}
```

## Output: SimResults

```rust
struct SimResults {
    // Summary stats
    iterations: u32,
    mean_dps: f64,
    std_dps: f64,
    min_dps: f64,
    max_dps: f64,

    // Breakdown by spell
    spell_breakdown: Vec<SpellStats>,

    // Optional detailed timeline (for single sim debugging)
    timeline: Option<Vec<TimelineEvent>>,
}

struct SpellStats {
    spell_id: u32,
    casts: u64,
    damage: f64,
    dps_contribution: f64,
    pct_of_total: f32,
}
```

---

## Implementation Phases

### Phase 1: Core Framework
- [ ] Event queue (binary heap, fixed capacity)
- [ ] Basic state machine (time, current cast, GCD)
- [ ] Spell casting (cooldowns, charges, GCD)
- [ ] Resource system (focus regen, spending)

### Phase 2: Damage & Auras
- [ ] Damage calculation (base + coefficients + stats)
- [ ] Aura system (apply, expire, stacks)
- [ ] Stat modifiers from auras
- [ ] Buff/debuff tracking

### Phase 3: Rotation System
- [ ] Condition evaluation (resource >= X, cooldown ready, aura active)
- [ ] Priority list execution
- [ ] Spell queue / cast sequence

### Phase 4: Beast Mastery Hunter
- [ ] Kill Command
- [ ] Barbed Shot (Frenzy stacks)
- [ ] Cobra Shot
- [ ] Bestial Wrath
- [ ] Kill Shot (execute)
- [ ] Call of the Wild
- [ ] Pet basic attacks
- [ ] Focus regeneration

### Phase 5: Advanced Systems
- [ ] Procs (chance-based, RPPM)
- [ ] Haste effects (GCD reduction, CD reduction)
- [ ] Mastery effects
- [ ] Trinkets
- [ ] Target health / execute phases

### Phase 6: Results & Stats
- [ ] DPS breakdown by spell
- [ ] Uptime tracking (buffs)
- [ ] Resource usage stats
- [ ] Timeline export (optional)

---

## Detailed Task Breakdown

### Event Queue
```rust
enum SimEvent {
    GcdReady,
    CastComplete { spell_id: u32 },
    SpellDamage { spell_id: u32, amount: f32 },
    AuraApply { aura_id: u32, stacks: u8 },
    AuraExpire { aura_id: u32 },
    AuraTick { aura_id: u32 },  // DoTs
    CooldownReady { spell_id: u32 },
    ResourceTick,  // Focus regen
    PetAttack,
}
```

### Spell System
- [ ] `SpellDef` - static data (from config)
- [ ] `SpellState` - runtime state (cooldown, charges)
- [ ] `can_cast(spell_id)` - check GCD, cooldown, resources, conditions
- [ ] `cast(spell_id)` - consume resources, start CD, schedule events

### Aura System
- [ ] `AuraDef` - static data
- [ ] `AuraInstance` - runtime (remaining duration, stacks)
- [ ] `apply_aura(aura_id)` - add/refresh/stack
- [ ] `remove_aura(aura_id)` - expire
- [ ] `has_aura(aura_id)` / `aura_stacks(aura_id)`
- [ ] Stat modifier aggregation

### Resource System
- [ ] `Resources` - current values (focus, health, etc.)
- [ ] `ResourceConfig` - max, regen rate
- [ ] `spend(amount)` / `gain(amount)`
- [ ] Periodic regen ticks

### Damage Calculation
```rust
fn calculate_damage(spell: &SpellDef, stats: &Stats, modifiers: &Modifiers) -> f32 {
    let base = spell.damage.base
        + spell.damage.ap_coeff * stats.attack_power()
        + spell.damage.sp_coeff * stats.spell_power();

    let crit_mult = if roll_crit(stats.crit) { 2.0 } else { 1.0 };
    let vers_mult = 1.0 + stats.versatility / 100.0;
    let mastery_mult = calculate_mastery_bonus(stats.mastery, spell);

    base * crit_mult * vers_mult * mastery_mult * modifiers.damage_mult
}
```

### Rotation Actions
```rust
enum RotationAction {
    Cast { spell_id: u32 },
    CastIf { spell_id: u32, condition: Condition },
    Wait { duration: f32 },
    Variable { name: String, value: Expression },
}

enum Condition {
    And(Vec<Condition>),
    Or(Vec<Condition>),
    Not(Box<Condition>),
    CooldownReady(u32),
    ResourceGte(ResourceType, f32),
    ResourceLte(ResourceType, f32),
    AuraActive(u32),
    AuraStacks(u32, Comparison, u8),
    TargetHealthPct(Comparison, f32),
    // etc.
}
```

---

## File Structure (Final)

```
crates/engine/
  src/
    lib.rs              # WASM entry, Simulator struct
    config.rs           # SimConfig, deserialization
    state.rs            # SimState, mutable runtime state
    events.rs           # EventQueue, SimEvent
    spells.rs           # SpellDef, SpellState, casting logic
    auras.rs            # AuraDef, AuraInstance, buff tracking
    resources.rs        # Focus, mana, etc.
    damage.rs           # Damage formulas, crit, modifiers
    rotation.rs         # Rotation evaluation, conditions
    stats.rs            # Stat aggregation, modifiers
    results.rs          # SimResults, SpellStats
    rng.rs              # FastRng

    specs/
      mod.rs
      hunter/
        mod.rs
        beast_mastery.rs   # BM-specific logic
```

---

## Data Mapping: Supabase → Rust

| Supabase Table | Rust Struct | Notes |
|----------------|-------------|-------|
| `wowlab_spells` | `SpellDef` | Main spell data |
| `wowlab_spell_effects` | `SpellEffect` | Damage, aura apply, etc. |
| `wowlab_auras` | `AuraDef` | Buff/debuff definitions |
| `wowlab_aura_effects` | `AuraEffect` | Stat mods, procs |

TypeScript builds the `SimConfig` JSON from these tables, Rust just consumes it.

---

## Testing Strategy

1. **Unit tests in Rust** - `cargo test`
   - Event queue ordering
   - Damage calculations
   - Aura stacking
   - Cooldown logic

2. **Integration tests** - Compare Rust vs Effect results
   - Same config, same seed → same output
   - Validate DPS within tolerance

3. **Benchmark tests** - `cargo bench`
   - Sims per second
   - Memory usage
   - Scaling with spell count

---

## Migration Path

1. Build Rust engine with full BM Hunter support
2. Run both Effect + Rust sims side by side
3. Compare results, fix discrepancies
4. Once parity achieved, switch default to Rust
5. Keep Effect version for debugging / development
