# SimulationCraft APL Feature Analysis

> Analysis of SimC's Action Priority List system to inform wowlab rotation engine requirements.

## Overview

SimC uses **priority-based Action Priority Lists (APLs)** - the simulator scans actions sequentially from highest to lowest priority until finding an available action. The system supports a rich expression language for conditions, variables, and multiple action types.

---

## 1. Variable Types in Conditions

### Resources (8 types with modifiers)

| Resource       | Description                 |
| -------------- | --------------------------- |
| `mana`         | Mana pool (casters)         |
| `rage`         | Rage pool (Warriors, tanks) |
| `energy`       | Energy pool (Rogues, Monks) |
| `focus`        | Focus pool (Hunters)        |
| `runic_power`  | Runic power (Death Knights) |
| `combo_points` | Combo points (Rogues)       |
| `soul_shards`  | Soul shards (Warlocks)      |
| `health`       | Current health              |

**Resource Modifiers:**

- `.max` - Maximum capacity
- `.pct` - Current as percentage (0-100)
- `.deficit` - Amount needed to reach full
- `.regen` - Current regeneration rate

```
if=energy>80
if=rage.pct>=50
if=focus.deficit>20
```

### Cooldowns

**Syntax:** `cooldown.<spell_name>.<property>`

| Property              | Type  | Description                          |
| --------------------- | ----- | ------------------------------------ |
| `.ready` / `.up`      | bool  | Off cooldown                         |
| `.remains`            | float | Seconds until ready                  |
| `.duration`           | float | Base cooldown duration               |
| `.charges`            | int   | Current charges                      |
| `.max_charges`        | int   | Maximum charges                      |
| `.full_recharge_time` | float | Time until all charges               |
| `.cooldown_react`     | bool  | Accounts for reaction time on resets |

```
if=cooldown.bestial_wrath.ready
if=cooldown.barbed_shot.charges>=2
if=cooldown.call_of_the_wild.remains>30
```

### Buffs / Debuffs

**Syntax:** `buff.<name>.<property>` or `debuff.<name>.<property>`

| Property          | Type  | Description                           |
| ----------------- | ----- | ------------------------------------- |
| `.up` / `.active` | bool  | Currently active                      |
| `.down`           | bool  | Not active                            |
| `.remains`        | float | Seconds remaining                     |
| `.stack`          | int   | Current stacks                        |
| `.max_stack`      | int   | Maximum stacks                        |
| `.react`          | int   | Stacks (accounting for reaction time) |
| `.duration`       | float | Total duration when applied           |
| `.value`          | float | Stored value (for value buffs)        |

```
if=buff.bestial_wrath.up
if=buff.frenzy.stack>=3
if=debuff.hunters_mark.remains<3
```

### DoTs (Damage over Time)

**Syntax:** `dot.<name>.<property>`

| Property        | Type  | Description                      |
| --------------- | ----- | -------------------------------- |
| `.ticking`      | bool  | DoT is active                    |
| `.remains`      | float | Time remaining                   |
| `.refreshable`  | bool  | < 30% duration remaining         |
| `.ticks_remain` | int   | Ticks remaining                  |
| `.pmultiplier`  | float | Persistent multiplier (snapshot) |

```
if=dot.barbed_shot.ticking
if=dot.serpent_sting.refreshable
```

### Target Properties

| Property             | Type  | Description                |
| -------------------- | ----- | -------------------------- |
| `target.health.pct`  | float | Health percentage (0-100)  |
| `target.time_to_die` | float | Estimated seconds to death |
| `target.distance`    | float | Yards to target            |
| `active_enemies`     | int   | Number of active enemies   |
| `target.level`       | int   | Target level               |

```
if=target.health.pct<20
if=target.time_to_die>10
if=active_enemies>=3
```

### Time Properties

| Property        | Type  | Description                        |
| --------------- | ----- | ---------------------------------- |
| `time`          | float | Seconds into combat                |
| `fight_remains` | float | Estimated remaining fight duration |
| `gcd.remains`   | float | Time until GCD ready               |
| `gcd.max`       | float | Hasted GCD duration                |

```
if=time<5
if=fight_remains>30
if=gcd.remains<0.1
```

### Action/Spell Properties

| Property       | Type  | Description            |
| -------------- | ----- | ---------------------- |
| `cast_time`    | float | Cast time in seconds   |
| `execute_time` | float | Total execution time   |
| `cooldown`     | float | Base cooldown duration |
| `cost`         | float | Resource cost          |
| `charges`      | int   | Charges available      |

```
if=cast_time<gcd.remains
```

### Talent/Spec/Race

| Property                | Type | Description            |
| ----------------------- | ---- | ---------------------- |
| `talent.<name>.enabled` | bool | Talent is selected     |
| `spec.<name>`           | bool | Is this specialization |
| `race.<name>`           | bool | Is this race           |

```
if=talent.killer_instinct.enabled
if=spec.beast_mastery
```

### Pet Properties

**Syntax:** `pet.<name>.<property>` or `pet.<property>`

| Property             | Type  | Description                      |
| -------------------- | ----- | -------------------------------- |
| `pet.active`         | bool  | Pet is alive                     |
| `pet.remains`        | float | Temporary pet duration remaining |
| `pet.buff.<name>.up` | bool  | Pet has buff                     |

### Trinket Properties

| Property                     | Type  | Description           |
| ---------------------------- | ----- | --------------------- |
| `trinket.1.cooldown.remains` | float | Slot 1 trinket CD     |
| `trinket.2.ready`            | bool  | Slot 2 trinket ready  |
| `trinket.1.has_stat.<stat>`  | bool  | Trinket provides stat |
| `equipped.<item>`            | bool  | Item is equipped      |

### Raid Event Properties

**Syntax:** `raid_event.<type>.<property>`

| Property    | Type  | Description         |
| ----------- | ----- | ------------------- |
| `.in`       | float | Time until event    |
| `.duration` | float | Event duration      |
| `.exists`   | bool  | Event is configured |

---

## 2. Operators

### Comparison

| Operator    | Description           |
| ----------- | --------------------- |
| `=` or `==` | Equal                 |
| `!=`        | Not equal             |
| `<`         | Less than             |
| `<=`        | Less than or equal    |
| `>`         | Greater than          |
| `>=`        | Greater than or equal |

### Arithmetic

| Operator | Description    |
| -------- | -------------- |
| `+`      | Addition       |
| `-`      | Subtraction    |
| `*`      | Multiplication |
| `%`      | Division       |
| `%%`     | Modulus        |

### Logical

| Operator | Description |
| -------- | ----------- |
| `&`      | AND         |
| `\|`     | OR          |
| `^`      | XOR         |
| `!`      | NOT (unary) |

### Special

| Operator | Description            |
| -------- | ---------------------- |
| `<?`     | Max (returns larger)   |
| `>?`     | Min (returns smaller)  |
| `@`      | Absolute value (unary) |

### Functions

| Function   | Description |
| ---------- | ----------- |
| `floor(x)` | Round down  |
| `ceil(x)`  | Round up    |

### Precedence (highest to lowest)

1. Functions: `floor()`, `ceil()`
2. Unary: `!`, `-`, `@`
3. Multiplicative: `*`, `%`, `%%`
4. Additive: `+`, `-`
5. Min/Max: `<?`, `>?`
6. Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`
7. Logical AND: `&`
8. Logical XOR: `^`
9. Logical OR: `|`

---

## 3. Action Types

### Basic Spell Cast

```
actions+=/kill_command
actions+=/cobra_shot,if=focus>=50
```

### Action List Control

| Action                    | Description                              |
| ------------------------- | ---------------------------------------- |
| `call_action_list,name=X` | Call sub-list, return if no action found |
| `run_action_list,name=X`  | Execute sub-list, no return              |

```
actions+=/call_action_list,name=cooldowns
actions+=/run_action_list,name=execute,if=target.health.pct<20
```

### Resource Management

| Action                          | Description                        |
| ------------------------------- | ---------------------------------- |
| `pool_resource,for_next=1`      | Wait for resources for next action |
| `pool_resource,extra_amount=20` | Wait for extra resources           |
| `wait,sec=5`                    | Wait fixed duration                |
| `wait_until_ready`              | Wait for specific cooldown         |

### Variable Operations

**Syntax:** `variable,name=X,op=Y,value=Z`

| Operation | Description            |
| --------- | ---------------------- |
| `set`     | Assign value (default) |
| `add`     | Add to value           |
| `sub`     | Subtract from value    |
| `mul`     | Multiply value         |
| `div`     | Divide value           |
| `min`     | Keep minimum           |
| `max`     | Keep maximum           |
| `reset`   | Reset to default       |

```
variable,name=sync_ready,op=set,value=cooldown.bestial_wrath.ready&cooldown.call_of_the_wild.ready
variable,name=focus_for_kc,op=set,value=focus-cost.kill_command
```

### Item/Consumable Usage

```
actions+=/use_item,name=manic_grieftorch
actions+=/potion,if=buff.bloodlust.up
```

### Other Actions

| Action                         | Description              |
| ------------------------------ | ------------------------ |
| `auto_attack`                  | Enable auto attacks      |
| `snapshot_stats`               | Capture pre-combat stats |
| `cancel_buff,name=X`           | Remove buff              |
| `start_moving` / `stop_moving` | Movement control         |

---

## 4. Action Modifiers

| Modifier              | Description              | Example              |
| --------------------- | ------------------------ | -------------------- |
| `if=<cond>`           | Conditional execution    | `if=focus>=30`       |
| `target=<name>`       | Specify target           | `target=add1`        |
| `cycle_targets=1`     | Cycle through targets    | For multi-DoT        |
| `line_cd=<sec>`       | Per-action cooldown      | `line_cd=10`         |
| `sync=<action>`       | Sync with another action | `sync=bestial_wrath` |
| `moving=0\|1`         | Movement restriction     | `moving=0`           |
| `interrupt_if=<cond>` | Interrupt channel        | For channels         |

---

## 5. APL Structure Example

```
# Precombat
actions.precombat=flask
actions.precombat+=/food
actions.precombat+=/snapshot_stats

# Variables
actions.precombat+=/variable,name=trinket_sync,value=trinket.1.has_stat.any_dps

# Main entry point
actions=auto_attack
actions+=/call_action_list,name=cooldowns,if=target.time_to_die>15
actions+=/call_action_list,name=cleave,if=active_enemies>1
actions+=/call_action_list,name=st

# Cooldowns sub-list
actions.cooldowns=bestial_wrath,if=cooldown.call_of_the_wild.remains>30|buff.call_of_the_wild.up
actions.cooldowns+=/call_of_the_wild,if=cooldown.bestial_wrath.remains<5

# Single target
actions.st=kill_command,if=focus>=30
actions.st+=/barbed_shot,if=buff.frenzy.remains<2|charges>=2
actions.st+=/cobra_shot,if=focus>=50

# Cleave
actions.cleave=multi_shot,if=buff.beast_cleave.remains<0.5
actions.cleave+=/call_action_list,name=st
```

---

## 6. Features We Need to Support

### Must Have (P0)

- [x] Resources: focus, energy, mana, rage, etc. with .max, .pct, .deficit
- [x] Cooldowns: .ready, .remains, .charges
- [x] Buffs/Debuffs: .up, .down, .remains, .stack
- [x] Target: .health.pct, .time_to_die, active_enemies
- [x] Time: time, fight_remains, gcd.remains
- [x] Basic operators: &, |, !, <, >, <=, >=, =, !=
- [x] Arithmetic: +, -, \*, %, %%
- [x] Spell casting with conditions
- [x] Action list calls (call_action_list)

### Should Have (P1)

- [ ] DoTs: .ticking, .remains, .refreshable
- [ ] Variables: set, add, sub, min, max operations
- [ ] Talents: talent.<name>.enabled (compile-time constant fold)
- [ ] Pet properties: pet.active, pet.buff.X.up
- [ ] floor() and ceil() functions
- [ ] cycle_targets for multi-DoT
- [ ] Min/max operators: <?, >?

### Nice to Have (P2)

- [ ] Trinket properties
- [ ] Raid event properties
- [ ] line_cd modifier
- [ ] sync modifier
- [ ] moving modifier
- [ ] pool_resource
- [ ] Sequences (strict_sequence)

### Out of Scope (for now)

- String operators (~, !~)
- SpellQuery syntax
- External APL file parsing

---

## 7. Key Differences from Current Implementation

| Current              | SimC                 | Action Needed             |
| -------------------- | -------------------- | ------------------------- |
| Numeric slot indices | Named spells/auras   | Implement name resolution |
| Fixed context struct | Dynamic variables    | Support user-defined vars |
| Flat priority list   | Nested action lists  | Add call_action_list      |
| No DoT tracking      | Full DoT state       | Add dot.X.Y support       |
| No arithmetic        | Full expression math | Already supported         |

---

## Sources

- [ActionLists Wiki](https://github.com/simulationcraft/simc/wiki/ActionLists)
- [Action List Conditional Expressions](https://github.com/simulationcraft/simc/wiki/Action-List-Conditional-Expressions)
- [SimulationCraft Documentation](https://simulationcraft.org/doc/)
