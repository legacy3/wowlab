# Reference: Spell Data Sources

> **This is a reference document.** Use this to understand where aura data comes from and how to decode spell attributes.

## Data Available in WoWLab MCP Server

All this data is queryable via the wowlab MCP server tools.

### Key Tables

| Table                    | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `spell_misc`             | Attributes (bitmasks), duration index, range index |
| `spell_duration`         | Duration lookup (ID → milliseconds)                |
| `spell_effect`           | Effect types, tick periods, aura types             |
| `spell_aura_options`     | Stack caps, proc chances, RPPM                     |
| `spell_procs_per_minute` | RPPM base frequencies                              |

### Joining Tables

```
spell_misc (SpellID)
    ↓
    DurationIndex → spell_duration (ID) → Duration (ms)
    ↓
spell_effect (SpellID) → EffectAuraPeriod, EffectAura
    ↓
spell_aura_options (SpellID) → CumulativeAura, ProcChance
```

## Spell Attribute Bitmasks

The `Attributes_0` through `Attributes_15` columns are bitmasks. Each attribute is a single number encoding column and bit:

- **Column** = `attribute / 32`
- **Bit** = `attribute % 32`
- **Check** = `(Attributes_[column] & (1 << bit)) !== 0`

### Key Attributes for Auras

| Attribute                     | Value | Column | Bit | Purpose                             |
| ----------------------------- | ----- | ------ | --- | ----------------------------------- |
| `SX_REFRESH_EXTENDS_DURATION` | 436   | 13     | 20  | Pandemic refresh                    |
| `SX_ROLLING_PERIODIC`         | 334   | 10     | 14  | Rolling periodic (tick carryover)   |
| `SX_DURATION_HASTED`          | 273   | 8      | 17  | Duration scales with haste          |
| `SX_TICK_ON_APPLICATION`      | 169   | 5      | 9   | Tick fires immediately on apply     |
| `SX_DOT_HASTED`               | 173   | 5      | 13  | Tick period affected by haste       |
| `SX_DOT_HASTED_MELEE`         | 278   | 8      | 22  | Tick period affected by melee haste |
| `SX_TICK_MAY_CRIT`            | 265   | 8      | 9   | Periodic ticks can crit             |

### Attribute Check Function

```typescript
function hasSpellAttribute(spellMisc: SpellMisc, attribute: number): boolean {
  const column = Math.floor(attribute / 32);
  const bit = attribute % 32;
  const mask = 1 << bit;
  const attrKey = `Attributes_${column}` as keyof SpellMisc;
  const attrValue = spellMisc[attrKey] as number;
  return (attrValue & mask) !== 0;
}
```

## Aura Types (EffectAura Values)

The `EffectAura` column in `spell_effect` identifies what the aura does:

### Periodic Effects

| Value | Name                       | Description                         |
| ----- | -------------------------- | ----------------------------------- |
| 3     | `A_PERIODIC_DAMAGE`        | Periodic damage (DoT)               |
| 8     | `A_PERIODIC_HEAL`          | Periodic healing (HoT)              |
| 20    | `A_PERIODIC_HEAL_PCT`      | Periodic % healing                  |
| 23    | `A_PERIODIC_TRIGGER_SPELL` | Periodically triggers another spell |
| 24    | `A_PERIODIC_ENERGIZE`      | Periodic resource gain              |
| 53    | `A_PERIODIC_LEECH`         | Periodic damage + heal              |

### Stat Modifiers

| Value | Name                        | Description            |
| ----- | --------------------------- | ---------------------- |
| 29    | `A_MOD_STAT`                | Modify a stat          |
| 79    | `A_MOD_DAMAGE_PERCENT_DONE` | % damage done modifier |
| 52    | `A_MOD_CRIT_PERCENT`        | Crit chance modifier   |

### Spell Modifiers

| Value | Name                  | Description                     |
| ----- | --------------------- | ------------------------------- |
| 107   | `A_ADD_FLAT_MODIFIER` | Flat modifier to spell property |
| 108   | `A_ADD_PCT_MODIFIER`  | % modifier to spell property    |

## Property Types (EffectMiscValue_0 for Modifiers)

When `EffectAura` is 107/108, `EffectMiscValue_0` tells what property is modified:

| Value | Name           | Modifies       |
| ----- | -------------- | -------------- |
| 0     | `P_GENERIC`    | Generic/damage |
| 1     | `P_DURATION`   | Duration       |
| 4     | `P_STACK`      | Stack count    |
| 11    | `P_COOLDOWN`   | Cooldown       |
| 19    | `P_TICK_TIME`  | Tick period    |
| 37    | `P_MAX_STACKS` | Max stacks     |

## SpellAuraOptions Fields

| Column                             | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `CumulativeAura`                   | Max stacks (0 = no stacking, treat as 1) |
| `ProcChance`                       | Proc chance (100 = 100%)                 |
| `ProcCharges`                      | Number of charges                        |
| `SpellProcsPerMinuteID`            | Links to RPPM table                      |
| `ProcTypeMask_0`, `ProcTypeMask_1` | What can trigger the proc                |

## Complete Attribute Constants

```typescript
// Aura Refresh & Duration
const SX_REFRESH_EXTENDS_DURATION = 436; // Pandemic refresh
const SX_ROLLING_PERIODIC = 334; // Rolling periodic
const SX_DURATION_HASTED = 273; // Duration scales with haste

// Tick Behavior
const SX_TICK_ON_APPLICATION = 169; // Tick on apply
const SX_DOT_HASTED = 173; // Hasted tick period
const SX_DOT_HASTED_MELEE = 278; // Melee haste ticks
const SX_TICK_MAY_CRIT = 265; // Ticks can crit
const SX_TREAT_AS_PERIODIC = 121; // Treat as periodic

// Proc Behavior
const SX_NOT_A_PROC = 105; // Not a proc
const SX_CAN_PROC_FROM_PROCS = 122; // Can proc from procs
const SX_SUPPRESS_CASTER_PROCS = 112; // Suppress caster procs
const SX_SUPPRESS_TARGET_PROCS = 113; // Suppress target procs

// Combat Flags
const SX_PASSIVE = 6; // Passive
const SX_HIDDEN = 7; // Hidden
const SX_CHANNELED = 34; // Channeled
const SX_CANNOT_CRIT = 93; // Cannot crit
const SX_ALWAYS_HIT = 114; // Always hits
const SX_NO_THREAT = 42; // No threat
```
