# Reference: Spell Data Sources (v2)

Use this to decode DBC fields when building AuraDataFlat. Everything is queryable via the WoWLab MCP server.

## Key Tables

| Table                | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `spell_misc`         | Attributes (bitmasks), duration index, range index |
| `spell_duration`     | Duration lookup (ID → milliseconds)                |
| `spell_effect`       | Effect types, tick periods, aura types             |
| `spell_aura_options` | Stack caps, proc chances, RPPM                     |

## Joins

```
spell_misc (SpellID)
  DurationIndex → spell_duration (Duration, MaxDuration)
  → spell_effect rows (EffectAura, EffectAuraPeriod)
  → spell_aura_options (CumulativeAura, ProcChance)
```

## Attribute Bitmasks

`Attributes_0` … `Attributes_15` are bitmasks. To test attribute `N`:

```
column = Math.floor(N / 32)
bit    = N % 32
mask   = 1 << bit
(Attributes_column & mask) !== 0
```

### Aura-Relevant Attributes

| Attribute                     | Value | Meaning                             |
| ----------------------------- | ----- | ----------------------------------- |
| `SX_REFRESH_EXTENDS_DURATION` | 436   | Pandemic refresh                    |
| `SX_ROLLING_PERIODIC`         | 334   | Rolling periodic                    |
| `SX_DURATION_HASTED`          | 273   | Aura duration scales with haste     |
| `SX_TICK_ON_APPLICATION`      | 169   | First tick fires immediately        |
| `SX_DOT_HASTED`               | 173   | Tick period scales with haste       |
| `SX_DOT_HASTED_MELEE`         | 278   | Tick period scales with melee haste |
| `SX_TICK_MAY_CRIT`            | 265   | Periodic ticks can crit             |
| `SX_TREAT_AS_PERIODIC`        | 121   | Treat as periodic                   |

## Periodic Aura Types (EffectAura)

| Value | Name                       | Purpose                    |
| ----- | -------------------------- | -------------------------- |
| 3     | `A_PERIODIC_DAMAGE`        | DoT                        |
| 8     | `A_PERIODIC_HEAL`          | HoT                        |
| 20    | `A_PERIODIC_HEAL_PCT`      | % HoT                      |
| 23    | `A_PERIODIC_TRIGGER_SPELL` | Trigger spell periodically |
| 24    | `A_PERIODIC_ENERGIZE`      | Resource gain              |
| 53    | `A_PERIODIC_LEECH`         | Damage + heal              |

## Modifier Aura Types (EffectAura = 107/108)

`EffectMiscValue_0` indicates what is modified (e.g., `P_DURATION`, `P_TICK_TIME`, `P_MAX_STACKS`). See SimC enums for the full list.

Use this sheet when mapping DBC → AuraDataFlat in the transformer.
