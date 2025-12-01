# Beast Mastery Focus Mechanics

## Base Focus Regeneration

**Source:** `sc_hunter.cpp:8635-8646`

```cpp
resources.base_regen_per_second[RESOURCE_FOCUS] = 5;

// Modified by spec auras
for (auto spell : { specs.marksmanship_hunter, specs.survival_hunter, talents.pack_tactics }) {
  for (const spelleffect_data_t& effect : spell->effects()) {
    if (effect.ok() && effect.type() == E_APPLY_AURA &&
        effect.subtype() == A_MOD_POWER_REGEN_PERCENT)
      resources.base_regen_per_second[RESOURCE_FOCUS] *= 1 + effect.percent();
  }
}

resources.base[RESOURCE_FOCUS] = 100;
```

| Property          | Value               |
| ----------------- | ------------------- |
| Base regeneration | 5 Focus/second      |
| Max Focus         | 100                 |
| Regeneration type | DYNAMIC             |
| Affected by       | Haste, Attack Haste |

## BM-Specific Modifiers

### Pack Tactics

- Increases Focus regeneration percentage
- Applied via `A_MOD_POWER_REGEN_PERCENT` effect

## Focus Generation Sources

### Barbed Shot Buff

**Spell ID:** 246152
**Source:** `sc_hunter.cpp:8780-8790`

```cpp
buffs.barbed_shot[i]->set_tick_callback(
  [this](buff_t* b, int, timespan_t) {
    resource_gain(RESOURCE_FOCUS, b->default_value,
                  gains.barbed_shot, actions.barbed_shot);
  });
```

| Property       | Value          |
| -------------- | -------------- |
| Focus per tick | 5 (effectN(1)) |
| Tick interval  | 2 seconds      |
| Duration       | 8 seconds      |
| Total per buff | 20 Focus       |
| Max concurrent | 8 buffs        |

### Go for the Throat

- Pet crits generate Focus for hunter
- Reduces effective cost of rotation

## Focus Costs

| Ability      | Base Cost | Notes            |
| ------------ | --------- | ---------------- |
| Cobra Shot   | 35        | Primary spender  |
| Multi-Shot   | 40        | AoE spender      |
| Arcane Shot  | 40        | (Not used by BM) |
| Kill Command | 30        |                  |
| Revive Pet   | 35        | Utility          |

## Focus Pooling Considerations

### APL Logic

From `hunter_beast_mastery.simc`:

```
# Pool Focus for Bestial Wrath windows
actions+=/cobra_shot,if=focus.time_to_max<gcd*2
```

The APL considers:

- `focus.time_to_max` - Time until Focus is capped
- `gcd` - Global cooldown
- Ability costs vs current Focus

## Haste Interaction

Focus regeneration is affected by haste:

```cpp
regen_caches[CACHE_HASTE] = true;
regen_caches[CACHE_ATTACK_HASTE] = true;
```

This means:

- Higher haste = faster Focus regeneration
- More GCDs = more Focus spending opportunities
- Balance maintained through regeneration scaling

## Implementation Requirements

### Focus Resource Entity

```typescript
interface FocusResource {
  current: number;
  max: number;
  baseRegenPerSecond: number;

  // Calculated values
  regenPerSecond: number; // After haste
  timeToMax: number;
}
```

### Focus Management Service

```typescript
interface FocusManager {
  // Spend Focus
  spend(amount: number): Effect.Effect<void, InsufficientFocus>;

  // Gain Focus
  gain(amount: number, source: string): Effect.Effect<void>;

  // Query
  getCurrent(): number;
  getTimeToMax(): number;
  canAfford(cost: number): boolean;

  // Tick regeneration
  tick(deltaTime: number): Effect.Effect<void>;
}
```

### Barbed Shot Focus Tracking

```typescript
interface BarbedShotFocusBuff {
  id: number; // 0-7
  expiresAt: number;
  nextTickAt: number;
  focusPerTick: number;
}

// Up to 8 concurrent buffs
const barbedShotBuffs: BarbedShotFocusBuff[] = [];
```

## Focus Events

### Required Event Types

```typescript
type FocusEvent =
  | { type: "FOCUS_SPENT"; amount: number; ability: SpellID }
  | { type: "FOCUS_GAINED"; amount: number; source: string }
  | { type: "FOCUS_REGEN_TICK"; amount: number }
  | { type: "BARBED_SHOT_TICK"; buffIndex: number; amount: number };
```

### Event Scheduling

Barbed Shot ticks need to be scheduled:

```typescript
// On Barbed Shot cast
const tickInterval = 2000; // ms
const duration = 8000; // ms

for (let tick = tickInterval; tick <= duration; tick += tickInterval) {
  scheduler.schedule({
    type: "BARBED_SHOT_TICK",
    time: currentTime + tick,
    buffIndex: nextAvailableSlot,
    amount: 5,
  });
}
```
