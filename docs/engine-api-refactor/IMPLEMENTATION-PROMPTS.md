# Engine API Refactor - Implementation Prompts

Each phase below is a self-contained prompt you can give to a fresh Claude instance. Phases should be implemented in order as later phases depend on earlier ones.

---

## Phase 0.5: Architecture Cleanup

### Prompt

```
I need you to refactor the rotation system architecture in crates/engine/src/rotation/.

## Current State (Verified)

1. **Parallel Type Hierarchies**: VarPath (47 variants) and ResolvedVar (46 variants) in ast.rs and resolver.rs are nearly identical. This forces triple traversal: parse → resolve → compile.

2. **Monolithic populate_context**: context.rs:populate_context() is 352 lines with a giant match statement. Each condition type should populate its own context fields.

3. **Spec ID Triple Duplication**: Spell/aura IDs defined in 3 places:
   - specs/hunter/bm/constants.rs (const KILL_COMMAND: u32)
   - specs/hunter/bm/rotation.rs (spec_resolver fn)
   - specs/hunter/bm/handler.rs (spell registration)

   The reverse lookups (ID → name) are incomplete.

4. **Handler-Rotation Coupling**: SpecHandler trait ties gameplay logic to rotation logic.

## Tasks

1. **Merge VarPath and ResolvedVar**: Create a single Expr enum that uses resolved SpellId/AuraId types directly. String names should only exist at the JSON deserialization boundary.

2. **Domain Sub-Enums**: Split the monolithic Expr into domain sub-enums:
   ```rust
   pub enum Expr {
       Resource(ResourceExpr),
       Cooldown(CooldownExpr),
       Aura(AuraExpr),
       Combat(CombatExpr),
       Target(TargetExpr),
       Player(PlayerExpr),
       Spell(SpellExpr),
       Talent(TalentExpr),
       Gcd(GcdExpr),
       Pet(PetExpr),
       Logic(LogicExpr),
       Arithmetic(ArithmeticExpr),
       Literal(LiteralExpr),
       Variable(VariableExpr),
   }
   ```

3. **Distributed Context Population**: Each domain sub-enum implements its own context population via trait:
   ```rust
   trait PopulateContext {
       fn populate(&self, schema: &mut ContextSchema);
   }
   ```

4. **Centralized ID Registry**: Create a single SpecData struct that owns all spell/aura/talent definitions with bidirectional lookups.

## Files to Modify

- crates/engine/src/rotation/ast.rs (VarPath → Expr with sub-enums)
- crates/engine/src/rotation/resolver.rs (remove ResolvedVar, move resolution to parser)
- crates/engine/src/rotation/context.rs (split populate_context into trait impls)
- crates/engine/src/rotation/mod.rs (re-exports)
- crates/engine/src/specs/registry.rs (centralized SpecData)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. VarPath enum no longer exists
4. ResolvedVar enum no longer exists
5. populate_context() is < 50 lines (just iterates and calls trait methods)
6. Each domain has its own file: resource_expr.rs, cooldown_expr.rs, etc.
7. SpecData has both name_to_id() and id_to_name() methods that are complete
```

---

## Phase 1: Resource Expressions

### Prompt

```
I need you to implement Resource expressions for the rotation system.

## Specification

Resource expressions query the player's resource state (focus, energy, mana, etc.).

| Expression | Return Type | Description |
|------------|-------------|-------------|
| resource_current | Float | Current resource amount |
| resource_max | Float | Maximum resource capacity |
| resource_deficit | Float | max - current |
| resource_percent | Float | (current / max) * 100 |
| resource_deficit_percent | Float | (deficit / max) * 100 |
| resource_regen | Float | Haste-adjusted regen per second |
| resource_time_to_max | Float | Seconds to reach max |
| resource_time_to | Float | Seconds to reach specific amount |

## Current State (Verified)

- ResourceType enum exists in types/resource.rs with all resource types
- ResourcePool struct exists in resource/pool.rs with current, max, percent(), deficit()
- ResourceRegen exists in resource/regen.rs with haste-adjusted calculations
- Missing: The 8 expression variants in Expr enum that query these

## Tasks

1. Add ResourceExpr sub-enum to rotation/expr/resource.rs:
   ```rust
   #[derive(Debug, Clone, Serialize, Deserialize)]
   #[serde(tag = "type", rename_all = "snake_case")]
   pub enum ResourceExpr {
       ResourceCurrent { resource: ResourceType },
       ResourceMax { resource: ResourceType },
       ResourceDeficit { resource: ResourceType },
       ResourcePercent { resource: ResourceType },
       ResourceDeficitPercent { resource: ResourceType },
       ResourceRegen { resource: ResourceType },
       ResourceTimeToMax { resource: ResourceType },
       ResourceTimeTo { resource: ResourceType, amount: f64 },
   }
   ```

2. Implement evaluation against SimState:
   ```rust
   impl ResourceExpr {
       pub fn evaluate(&self, ctx: &EvalContext) -> Value {
           let pool = ctx.state.player.resources.get(resource);
           match self {
               Self::ResourceCurrent { resource } => Value::Float(pool.current),
               Self::ResourceDeficit { resource } => Value::Float(pool.max - pool.current),
               // etc.
           }
       }
   }
   ```

3. Implement context population for JIT compilation

4. Add JSON deserialization with string resource names that resolve to ResourceType

## Files to Modify

- crates/engine/src/rotation/expr/resource.rs (create)
- crates/engine/src/rotation/expr/mod.rs (re-export)
- crates/engine/src/rotation/eval.rs (add evaluation)
- crates/engine/src/rotation/context.rs (add context fields)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. JSON roundtrip test:
   ```rust
   #[test]
   fn test_resource_expr_json() {
       let json = r#"{"type": "resource_current", "resource": "focus"}"#;
       let expr: ResourceExpr = serde_json::from_str(json).unwrap();
       assert!(matches!(expr, ResourceExpr::ResourceCurrent { .. }));
   }
   ```
4. Evaluation test with mock SimState
5. resource_time_to_max returns correct value: (max - current) / regen
```

---

## Phase 2: Cooldown Expressions

### Prompt

```
I need you to implement Cooldown expressions for the rotation system.

## Specification

| Expression | Return Type | Description |
|------------|-------------|-------------|
| cooldown_ready | Bool | Cooldown is ready (charges > 0 or remaining = 0) |
| cooldown_remaining | Float | Seconds until ready |
| cooldown_duration | Float | Current haste-adjusted duration |
| cooldown_base_duration | Float | Base duration without haste |
| cooldown_charges | Int | Current available charges |
| cooldown_charges_max | Int | Maximum charges |
| cooldown_charges_fractional | Float | Fractional charges (e.g., 1.5) |
| cooldown_recharge_time | Float | Time for next charge |
| cooldown_full_recharge_time | Float | Time until all charges ready |

## Current State (Verified)

- Cooldown struct exists in combat/cooldown/cooldown.rs with base_duration, duration, ready_at, hasted flag
- ChargedCooldown exists in combat/cooldown/charges.rs with max_charges, current_charges, recharge_time
- Haste-adjusted duration calculation implemented
- 95% complete - only cooldown_charges_fractional missing

## Tasks

1. Add CooldownExpr sub-enum to rotation/expr/cooldown.rs:
   ```rust
   #[derive(Debug, Clone, Serialize, Deserialize)]
   #[serde(tag = "type", rename_all = "snake_case")]
   pub enum CooldownExpr {
       CooldownReady { spell: SpellId },
       CooldownRemaining { spell: SpellId },
       CooldownDuration { spell: SpellId },
       CooldownBaseDuration { spell: SpellId },
       CooldownCharges { spell: SpellId },
       CooldownChargesMax { spell: SpellId },
       CooldownChargesFractional { spell: SpellId },
       CooldownRechargeTime { spell: SpellId },
       CooldownFullRechargeTime { spell: SpellId },
   }
   ```

2. Add cooldown_charges_fractional calculation:
   ```rust
   fn charges_fractional(&self, now: f64) -> f64 {
       let full_charges = self.current_charges as f64;
       let partial = if self.current_charges < self.max_charges {
           1.0 - (self.next_charge_at - now) / self.recharge_time
       } else {
           0.0
       };
       full_charges + partial
   }
   ```

3. JSON deserialization with spell name → SpellId resolution

## Files to Modify

- crates/engine/src/rotation/expr/cooldown.rs (create)
- crates/engine/src/combat/cooldown/charges.rs (add charges_fractional method)
- crates/engine/src/rotation/expr/mod.rs (re-export)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. JSON roundtrip test for all 9 cooldown expressions
4. cooldown_charges_fractional test:
   ```rust
   #[test]
   fn test_charges_fractional() {
       let cd = ChargedCooldown::new(2, 10.0); // 2 charges, 10s recharge
       cd.use_charge(0.0); // Use at t=0, next charge at t=10
       assert_eq!(cd.charges_fractional(5.0), 1.5); // 1 charge + 0.5 partial
   }
   ```
5. cooldown_ready returns true when charges > 0
```

---

## Phase 3: Aura Expressions

### Prompt

```
I need you to implement Aura expressions for the rotation system.

## Specification

| Expression | Return Type | Description |
|------------|-------------|-------------|
| aura_active | Bool | Aura is present on target |
| aura_inactive | Bool | Aura is NOT present (convenience) |
| aura_remaining | Float | Seconds remaining |
| aura_stacks | Int | Current stack count |
| aura_stacks_max | Int | Maximum stacks |
| aura_duration | Float | Base duration |
| aura_refreshable | Bool | Below pandemic threshold (30%) |
| aura_ticking | Bool | Has periodic effect |
| aura_ticks_remaining | Int | Periodic ticks left |
| aura_tick_time | Float | Time between ticks |
| aura_next_tick | Float | Time until next tick |

Target specifier (AuraOn): player, target, pet

## Current State (Verified)

- AuraInstance exists in aura/instance.rs with full state tracking
- Pandemic logic (30% refresh threshold) implemented
- Periodic/tick tracking implemented
- 85% complete - missing aura_tick_time, aura_next_tick

## Tasks

1. Add AuraExpr sub-enum to rotation/expr/aura.rs
2. Add AuraOn enum:
   ```rust
   #[derive(Debug, Clone, Copy, Serialize, Deserialize)]
   #[serde(rename_all = "snake_case")]
   pub enum AuraOn {
       Player,
       Target,
       Pet,
   }
   ```
3. Add tick_time() and next_tick() methods to AuraInstance:
   ```rust
   impl AuraInstance {
       pub fn tick_time(&self) -> f64 {
           self.base_tick_interval / (1.0 + self.haste_snapshot)
       }

       pub fn next_tick(&self, now: f64) -> f64 {
           if !self.is_periodic() { return 0.0; }
           self.next_tick_at - now
       }
   }
   ```

4. Handle AuraOn::Pet when no pet active (return false/0)

## Files to Modify

- crates/engine/src/rotation/expr/aura.rs (create)
- crates/engine/src/aura/instance.rs (add tick_time, next_tick methods)
- crates/engine/src/rotation/expr/mod.rs (re-export)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. JSON roundtrip test for all 11 aura expressions
4. aura_refreshable test:
   ```rust
   #[test]
   fn test_aura_refreshable() {
       let aura = AuraInstance::new(10.0); // 10s duration
       aura.set_remaining(2.5); // 25% remaining
       assert!(aura.is_refreshable()); // Below 30% threshold
   }
   ```
5. Pet aura queries return false/0 when no pet active
```

---

## Phase 4: Combat & Target Expressions

### Prompt

```
I need you to implement Combat and Target expressions for the rotation system.

## Specification

### Combat
| Expression | Return Type | Description |
|------------|-------------|-------------|
| combat_time | Float | Seconds since combat start |
| combat_remaining | Float | Estimated seconds until combat ends |

### Target
| Expression | Return Type | Description |
|------------|-------------|-------------|
| target_health | Float | Current health |
| target_health_max | Float | Maximum health |
| target_health_percent | Float | Health percentage (0-100) |
| target_time_to_die | Float | Estimated seconds to death |
| target_time_to_percent | Float | Seconds to reach health % |
| target_distance | Float | Distance to target in yards |
| target_casting | Bool | Target is casting |
| target_moving | Bool | Target is moving |

### Enemy
| Expression | Return Type | Description |
|------------|-------------|-------------|
| enemy_count | Int | Number of active enemies |
| spell_targets_hit | Int | Enemies hit by spell |

## Current State (Verified)

- combat_time, combat_remaining: Implemented
- target_health_percent: Implemented
- target_time_to_die: Uses fight time stub, not actual health/DPS calculation
- target_distance: Hardcoded to 5.0
- Missing: target_health, target_health_max, target_time_to_percent, target_casting, target_moving, spell_targets_hit
- 50% complete

## Tasks

1. Add CombatExpr and TargetExpr sub-enums
2. Add EnemyExpr sub-enum
3. Implement actual target_time_to_die calculation:
   ```rust
   fn time_to_die(&self, dps: f64) -> f64 {
       if dps <= 0.0 { return f64::MAX; }
       self.current_health / dps
   }
   ```
4. Implement target_time_to_percent:
   ```rust
   fn time_to_percent(&self, percent: f64, dps: f64) -> f64 {
       let target_health = self.max_health * (percent / 100.0);
       let damage_needed = self.current_health - target_health;
       if damage_needed <= 0.0 { return 0.0; }
       damage_needed / dps
   }
   ```
5. Add target_casting and target_moving to Enemy struct
6. Implement spell_targets_hit based on spell AoE radius and enemy positions

## Files to Modify

- crates/engine/src/rotation/expr/combat.rs (create)
- crates/engine/src/rotation/expr/target.rs (create)
- crates/engine/src/rotation/expr/enemy.rs (create)
- crates/engine/src/actor/enemy.rs (add casting, moving fields)
- crates/engine/src/sim/state.rs (add DPS tracking for TTD)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. target_time_to_die test:
   ```rust
   #[test]
   fn test_time_to_die() {
       let enemy = Enemy::new(100000.0); // 100k health
       let dps = 10000.0; // 10k DPS
       assert_eq!(enemy.time_to_die(dps), 10.0);
   }
   ```
4. target_time_to_percent test:
   ```rust
   #[test]
   fn test_time_to_percent() {
       let enemy = Enemy::new(100000.0);
       enemy.set_health(50000.0); // 50% health
       let dps = 10000.0;
       // Time to reach 20%: (50k - 20k) / 10k = 3s
       assert_eq!(enemy.time_to_percent(20.0, dps), 3.0);
   }
   ```
5. enemy_count returns correct count from SimState
```

---

## Phase 5: Player Expressions

### Prompt

```
I need you to implement Player expressions for the rotation system.

## Specification

| Expression | Return Type | Description |
|------------|-------------|-------------|
| player_health | Float | Current health |
| player_health_max | Float | Maximum health |
| player_health_percent | Float | Health percentage (0-100) |
| player_health_deficit | Float | max - current |
| player_haste | Float | Haste rating % |
| player_crit | Float | Critical strike % |
| player_mastery | Float | Mastery % |
| player_versatility | Float | Versatility % |
| player_attack_power | Float | Attack power |
| player_spell_power | Float | Spell power |
| player_level | Int | Character level |
| player_armor | Float | Armor value |
| player_stamina | Float | Stamina stat |
| player_primary_stat | Float | Primary stat value |
| player_moving | Bool | Player is moving |
| player_movement_remaining | Float | Seconds of movement left |
| player_alive | Bool | Player is alive |
| player_in_combat | Bool | Player in combat |
| player_stealthed | Bool | Player is stealthed |
| player_mounted | Bool | Player is mounted |

## Current State (Verified)

- Stats infrastructure exists (PrimaryStats, Ratings, CombatStats in player.rs)
- player_haste, player_crit, player_mastery, player_versatility: Implemented
- player_health values: Hardcoded with TODO comment
- Missing: player_level, player_armor, player_health_deficit, player_alive, player_in_combat, player_stealthed, player_mounted, player_movement_remaining
- 45% complete

## Tasks

1. Add PlayerExpr sub-enum to rotation/expr/player.rs
2. Add proper health tracking to Player struct:
   ```rust
   pub struct Player {
       pub health: f64,
       pub max_health: f64,
       pub level: u8,
       pub alive: bool,
       pub in_combat: bool,
       pub stealthed: bool,
       pub mounted: bool,
       pub moving: bool,
       pub movement_duration: f64,
       // ... existing fields
   }
   ```
3. Implement all player condition evaluations
4. Remove hardcoded health values

## Files to Modify

- crates/engine/src/rotation/expr/player.rs (create)
- crates/engine/src/actor/player.rs (add missing fields)
- crates/engine/src/rotation/expr/mod.rs (re-export)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. player_health_percent test:
   ```rust
   #[test]
   fn test_player_health_percent() {
       let player = Player::new();
       player.health = 75000.0;
       player.max_health = 100000.0;
       assert_eq!(player.health_percent(), 75.0);
   }
   ```
4. All 20 player expressions have evaluation implementations
5. No hardcoded health values remain
```

---

## Phase 6: Spell, Talent, GCD & Pet Expressions

### Prompt

```
I need you to implement Spell, Talent, GCD, and Pet expressions for the rotation system.

## Specification

### Spell
| Expression | Return Type | Description |
|------------|-------------|-------------|
| spell_cost | Float | Resource cost |
| spell_cast_time | Float | Cast time (haste-adjusted) |
| spell_range | Float | Spell range in yards |
| spell_in_range | Bool | Target in range |
| spell_usable | Bool | Can cast (resources, CD, range) |

### Talent
| Expression | Return Type | Description |
|------------|-------------|-------------|
| talent_enabled | Bool | Talent is selected |
| talent_rank | Int | Current rank (if multi-rank) |
| talent_max_rank | Int | Maximum rank |

### GCD
| Expression | Return Type | Description |
|------------|-------------|-------------|
| gcd_active | Bool | GCD is running |
| gcd_remaining | Float | Seconds until GCD ready |
| gcd_duration | Float | Current GCD duration |

### Pet
| Expression | Return Type | Description |
|------------|-------------|-------------|
| pet_active | Bool | Pet is summoned |
| pet_count | Int | Number of active pets |
| pet_remaining | Float | Seconds until pet despawns |

## Current State (Verified)

- spell_usable: CastResult enum exists but no unified API function
- talent_enabled: Fully implemented
- talent_rank/talent_max_rank: Not implemented (no rank system in talents)
- GCD: Fully implemented (gcd_active, gcd_remaining, gcd_duration)
- Pet: Fully implemented (pet_active, pet_count, pet_remaining)
- 80% complete

## Tasks

1. Add SpellExpr, TalentExpr, GcdExpr, PetExpr sub-enums
2. Create spell_usable API function:
   ```rust
   impl Player {
       pub fn can_cast(&self, spell: SpellId, target: &Enemy) -> bool {
           let spell_data = self.spell_db.get(spell);

           // Check cooldown
           if !self.cooldowns.is_ready(spell) { return false; }

           // Check resources
           if self.resources.current(spell_data.resource) < spell_data.cost { return false; }

           // Check range
           if target.distance > spell_data.range { return false; }

           true
       }
   }
   ```
3. Add talent rank system (default to rank 1 for unranked talents)

## Files to Modify

- crates/engine/src/rotation/expr/spell.rs (create)
- crates/engine/src/rotation/expr/talent.rs (create)
- crates/engine/src/rotation/expr/gcd.rs (create)
- crates/engine/src/rotation/expr/pet.rs (create)
- crates/engine/src/actor/player.rs (add can_cast method)
- crates/engine/src/talent/mod.rs (add rank system)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. spell_usable test:
   ```rust
   #[test]
   fn test_spell_usable() {
       let mut player = Player::new();
       player.resources.set(ResourceType::Focus, 50.0);
       let spell = SpellId(1); // Cost: 30 focus
       assert!(player.can_cast(spell, &target));

       player.resources.set(ResourceType::Focus, 20.0);
       assert!(!player.can_cast(spell, &target));
   }
   ```
4. talent_rank returns 1 for enabled talents without explicit rank
5. All GCD expressions work with existing implementation
```

---

## Phase 7: Expression System

### Prompt

```
I need you to implement the expression system (logic, comparison, arithmetic).

## Specification

### Type System
| Type | Rust | Description |
|------|------|-------------|
| Bool | bool | Boolean true/false |
| Int | i64 | 64-bit signed integer |
| Float | f64 | 64-bit floating point |

### Logic
| Type | Returns | Description |
|------|---------|-------------|
| and | Bool | All operands true (short-circuit) |
| or | Bool | Any operand true (short-circuit) |
| not | Bool | Negate operand |

### Comparison
| Type | Returns | Description |
|------|---------|-------------|
| gt | Bool | left > right |
| gte | Bool | left >= right |
| lt | Bool | left < right |
| lte | Bool | left <= right |
| eq | Bool | left == right |
| ne | Bool | left != right |

### Arithmetic
| Type | Returns | Description |
|------|---------|-------------|
| add | Float | left + right |
| sub | Float | left - right |
| mul | Float | left * right |
| div | Float | left / right (div by 0 = 0.0) |
| mod | Float | left % right (true modulo) |

### Functions
| Type | Returns | Description |
|------|---------|-------------|
| floor | Float | Round down |
| ceil | Float | Round up |
| abs | Float | Absolute value |
| min | Float | Minimum of two |
| max | Float | Maximum of two |

## Current State (Verified)

- Expr enum 95% aligned with spec
- Missing: Division by zero guard (currently returns NaN, should return 0.0)
- Missing: Float epsilon comparison (1e-6 tolerance)
- Missing: Short-circuit evaluation for And/Or
- Missing: Max expression depth validation (100 levels)

## Tasks

1. Add division by zero guard:
   ```rust
   fn safe_div(a: f64, b: f64) -> f64 {
       if b == 0.0 { 0.0 } else { a / b }
   }
   ```

2. Add float epsilon comparison:
   ```rust
   const EPSILON: f64 = 1e-6;

   fn float_eq(a: f64, b: f64) -> bool {
       (a - b).abs() < EPSILON
   }
   ```

3. Implement short-circuit evaluation:
   ```rust
   Expr::And { operands } => {
       for op in operands {
           if !op.evaluate(ctx).as_bool() {
               return Value::Bool(false);
           }
       }
       Value::Bool(true)
   }
   ```

4. Add depth validation at parse time:
   ```rust
   impl Expr {
       pub fn validate_depth(&self, depth: usize) -> Result<(), ParseError> {
           if depth > 100 {
               return Err(ParseError::MaxDepthExceeded);
           }
           // Recursively check children
       }
   }
   ```

5. Implement true modulo (result has same sign as divisor):
   ```rust
   fn true_mod(a: f64, b: f64) -> f64 {
       if b == 0.0 { return 0.0; }
       ((a % b) + b) % b
   }
   ```

## Files to Modify

- crates/engine/src/rotation/expr/logic.rs (create)
- crates/engine/src/rotation/expr/comparison.rs (create)
- crates/engine/src/rotation/expr/arithmetic.rs (create)
- crates/engine/src/rotation/expr/literal.rs (create)
- crates/engine/src/rotation/eval.rs (add safe_div, float_eq, true_mod)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. Division by zero test:
   ```rust
   #[test]
   fn test_div_by_zero() {
       let expr = Expr::Div {
           left: Box::new(Expr::Float { value: 10.0 }),
           right: Box::new(Expr::Float { value: 0.0 })
       };
       assert_eq!(expr.evaluate(&ctx), Value::Float(0.0));
   }
   ```
4. Short-circuit test:
   ```rust
   #[test]
   fn test_short_circuit_and() {
       let mut call_count = 0;
       let expr = Expr::And {
           operands: vec![
               Expr::Bool { value: false },
               // This should NOT be evaluated
               Expr::Bool { value: true },
           ]
       };
       // Only first operand evaluated
   }
   ```
5. True modulo test: `-7 mod 3 = 2` (not -1)
6. Max depth validation rejects depth > 100
```

---

## Phase 8: Action System

### Prompt

```
I need you to implement the Action system for rotations.

## Specification

### GCD-Consuming Actions
| Action | Description | Consumes GCD |
|--------|-------------|--------------|
| cast | Cast a spell | Yes (if successful) |
| use_trinket | Use trinket by slot | Yes (if successful) |
| use_item | Use item by name | Yes (if successful) |

### Non-GCD Actions
| Action | Description | Consumes GCD |
|--------|-------------|--------------|
| set_var | Set variable value | No |
| modify_var | Modify variable | No |
| call | Execute sub-list | Propagates |
| run | Execute sub-list | Never |

### GCD-Cycle Actions
| Action | Description | Behavior |
|--------|-------------|----------|
| wait | Fixed time pause | Re-evaluate after |
| wait_until | Condition pause | Re-evaluate after |
| pool | Wait for resources | Re-evaluate after |

### Variable Operations
| Op | Description | Valid Types |
|----|-------------|-------------|
| set | var = value | all |
| add | var += value | int, float |
| sub | var -= value | int, float |
| mul | var *= value | int, float |
| div | var /= value | int, float |
| min | var = min(var, value) | int, float |
| max | var = max(var, value) | int, float |
| reset | var = initial_value | all |

## Current State (Verified)

- cast, call, run: Fully implemented
- set_var, modify_var: AST defined but JIT skips execution (needs fix)
- wait, wait_until: Implemented
- pool: AST defined but not executed
- use_trinket, use_item: AST defined but no execution (no equipment system)
- 70% complete

## Tasks

1. Fix set_var and modify_var JIT execution:
   ```rust
   Action::SetVar { name, value, condition } => {
       if let Some(cond) = condition {
           if !cond.evaluate(ctx).as_bool() {
               return ActionResult::Continue;
           }
       }
       let val = value.evaluate(ctx);
       ctx.variables.insert(name.clone(), val);
       ActionResult::Continue
   }
   ```

2. Implement pool action:
   ```rust
   Action::Pool { deficit, condition } => {
       if let Some(cond) = condition {
           if !cond.evaluate(ctx).as_bool() {
               return ActionResult::Continue;
           }
       }
       let target = ctx.state.player.resources.max() - deficit.unwrap_or(0.0);
       if ctx.state.player.resources.current() >= target {
           return ActionResult::Continue;
       }
       ActionResult::Pool { target }
   }
   ```

3. Implement use_trinket action (stub for now, mark equipment system as future work):
   ```rust
   Action::UseTrinket { slot, condition } => {
       // TODO: Implement when equipment system exists
       ActionResult::Continue
   }
   ```

4. Add variable type checking at parse time

## Files to Modify

- crates/engine/src/rotation/action.rs (fix execution)
- crates/engine/src/rotation/executor.rs (add pool, use_trinket, use_item)
- crates/engine/src/rotation/compiler.rs (fix JIT for variables)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. set_var execution test:
   ```rust
   #[test]
   fn test_set_var() {
       let mut ctx = EvalContext::new();
       let action = Action::SetVar {
           name: "pooling".to_string(),
           value: Expr::Bool { value: true },
           condition: None,
       };
       action.execute(&mut ctx);
       assert_eq!(ctx.variables.get("pooling"), Some(&Value::Bool(true)));
   }
   ```
4. modify_var add test:
   ```rust
   #[test]
   fn test_modify_var_add() {
       let mut ctx = EvalContext::new();
       ctx.variables.insert("count".to_string(), Value::Int(5));
       let action = Action::ModifyVar {
           name: "count".to_string(),
           op: VarOp::Add,
           value: Expr::Int { value: 3 },
           condition: None,
       };
       action.execute(&mut ctx);
       assert_eq!(ctx.variables.get("count"), Some(&Value::Int(8)));
   }
   ```
5. pool action returns Pool result when resources insufficient
6. use_trinket and use_item compile without error (stub implementation ok)
```

---

## Phase 9: Integration & Testing

### Prompt

```
I need you to integrate all the expression and action types and create comprehensive tests.

## Tasks

1. Create the complete Expr enum that unifies all sub-enums:
   ```rust
   #[derive(Debug, Clone, Serialize, Deserialize)]
   #[serde(tag = "type", rename_all = "snake_case")]
   pub enum Expr {
       // Literals
       Bool { value: bool },
       Int { value: i64 },
       Float { value: f64 },

       // Logic
       And { operands: Vec<Expr> },
       Or { operands: Vec<Expr> },
       Not { operand: Box<Expr> },

       // ... all other variants from 09-complete-enum.md
   }
   ```

2. Implement return_type() for all variants
3. Implement validate() for identifier validation
4. Create integration tests with real rotations

## Integration Test

Create a test rotation JSON:
```json
{
  "name": "BM Hunter ST",
  "variables": {
    "pooling": {"type": "bool", "value": false}
  },
  "lists": {
    "cooldowns": [
      {"type": "cast", "spell": "bestial_wrath"},
      {"type": "cast", "spell": "aspect_of_the_wild"}
    ],
    "st": [
      {
        "type": "cast",
        "spell": "kill_command",
        "condition": {
          "type": "and",
          "operands": [
            {"type": "cooldown_ready", "spell": "kill_command"},
            {"type": "gte",
             "left": {"type": "resource_current", "resource": "focus"},
             "right": {"type": "float", "value": 30}
            }
          ]
        }
      }
    ]
  },
  "actions": [
    {"type": "call", "list": "cooldowns"},
    {"type": "run", "list": "st"}
  ]
}
```

## Files to Create/Modify

- crates/engine/src/rotation/expr/mod.rs (unified Expr enum)
- crates/engine/src/rotation/tests/integration.rs (create)
- crates/engine/src/rotation/tests/mod.rs (create)

## Verification Criteria

1. `cargo build --release` passes
2. `cargo test` passes
3. All 80+ expression variants compile
4. JSON roundtrip for complete rotation
5. Rotation executes and produces expected spell sequence
6. WASM build succeeds: `wasm-pack build --target web`
7. No regression in existing tests
```

---

## Quick Reference: Phase Dependencies

```
Phase 0.5 (Cleanup) - Foundation, do first
    ↓
Phases 1-6 (Domain Expressions) - Can be done in parallel after 0.5
    ↓
Phase 7 (Expression System) - Depends on domain expressions
    ↓
Phase 8 (Actions) - Depends on expression system
    ↓
Phase 9 (Integration) - Final integration and testing
```

## Quick Reference: Files by Phase

| Phase | Key Files |
|-------|-----------|
| 0.5 | ast.rs, resolver.rs, context.rs, registry.rs |
| 1 | expr/resource.rs |
| 2 | expr/cooldown.rs, cooldown/charges.rs |
| 3 | expr/aura.rs, aura/instance.rs |
| 4 | expr/combat.rs, expr/target.rs, expr/enemy.rs |
| 5 | expr/player.rs, actor/player.rs |
| 6 | expr/spell.rs, expr/talent.rs, expr/gcd.rs, expr/pet.rs |
| 7 | expr/logic.rs, expr/arithmetic.rs, expr/comparison.rs |
| 8 | action.rs, executor.rs, compiler.rs |
| 9 | expr/mod.rs, tests/integration.rs |
