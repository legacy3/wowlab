# Spell Description Variables Reference

This document catalogs all variables that need to be replaced when parsing WoW spell descriptions from the DBC data.

## Overview

Spell descriptions in `raw_dbc.spell.Description_lang` and `raw_dbc.spell.AuraDescription_lang` contain placeholder variables that must be resolved at runtime. These variables reference spell effect data, player stats, conditionals, and cross-spell references.

---

## 1. Effect Variables (Current Spell)

These reference data from `spell_effect` for the current spell. The number suffix (1-9) corresponds to `EffectIndex`.

| Variable      | Description                    | Source Table | Source Column                             |
| ------------- | ------------------------------ | ------------ | ----------------------------------------- |
| `$s1`-`$s9`   | Effect base points             | spell_effect | EffectBasePointsF                         |
| `$m1`-`$m9`   | Effect base points (alternate) | spell_effect | EffectBasePointsF                         |
| `$M1`-`$M9`   | Effect max value               | spell_effect | Calculated                                |
| `$o1`-`$o9`   | Total periodic damage/healing  | Calculated   | `EffectBasePointsF * (duration / period)` |
| `$t1`-`$t9`   | Tick/period interval (seconds) | spell_effect | EffectAuraPeriod / 1000                   |
| `$a1`-`$a9`   | Effect radius                  | spell_radius | Radius (via EffectRadiusIndex_0)          |
| `$A1`-`$A9`   | Effect max radius              | spell_radius | RadiusMax                                 |
| `$e1`-`$e9`   | Points per resource            | spell_effect | EffectPointsPerResource                   |
| `$w1`-`$w9`   | Effect amplitude               | spell_effect | EffectAmplitude                           |
| `$x1`-`$x9`   | Chain targets                  | spell_effect | EffectChainTargets                        |
| `$bc1`-`$bc9` | Bonus coefficient              | spell_effect | EffectBonusCoefficient                    |
| `$q1`-`$q9`   | Effect misc value              | spell_effect | EffectMiscValue_0                         |

### Examples

```
"Inflicts $s1 damage every $t1 sec for $d."
→ "Inflicts 500 damage every 3 sec for 15 sec."

"Heals the target for $o1 over $d."
→ "Heals the target for 5000 over 10 sec."
```

---

## 2. Spell-Level Variables (Current Spell)

| Variable    | Description                | Source Table              | Source Column                           |
| ----------- | -------------------------- | ------------------------- | --------------------------------------- |
| `$d`        | Duration                   | spell_duration            | Duration (via spell_misc.DurationIndex) |
| `$d1`-`$d3` | Duration (indexed)         | spell_duration            | Duration                                |
| `$n`        | Proc charges / stack count | spell_aura_options        | ProcCharges                             |
| `$u`        | Max stacks                 | spell_aura_options        | CumulativeAura                          |
| `$h`        | Proc chance %              | spell_aura_options        | ProcChance                              |
| `$r`        | Range                      | spell_range               | RangeMax_0 (via spell_misc.RangeIndex)  |
| `$i`        | Max affected targets       | spell_target_restrictions | MaxTargets                              |
| `$c1`-`$c3` | Combo points consumed      | -                         | Context-dependent                       |
| `$p1`-`$p9` | Power cost / resource      | spell_power               | ManaCost / PowerCostPct                 |
| `$z`        | Home area/zone name        | -                         | Localization                            |

### Examples

```
"Lasts $d."
→ "Lasts 30 sec."

"Strikes up to $n times with $h% chance each."
→ "Strikes up to 3 times with 25% chance each."
```

---

## 3. Cross-Spell References

Reference data from other spells using format `$<spellID><suffix>`:

| Pattern    | Example      | Description                            |
| ---------- | ------------ | -------------------------------------- |
| `$<id>s1`  | `$424509s1`  | Effect 1 base points from spell 424509 |
| `$<id>d`   | `$214621d`   | Duration from spell 214621             |
| `$<id>t1`  | `$8188t1`    | Tick interval from spell 8188          |
| `$<id>m1`  | `$76657m1`   | Effect value from spell 76657          |
| `$<id>o2`  | `$164812o2`  | Total periodic from spell 164812       |
| `$<id>a1`  | `$8146a1`    | Radius from spell 8146                 |
| `$<id>A1`  | `$166171A1`  | Max radius from spell 166171           |
| `$<id>bc1` | `$296146bc1` | Bonus coefficient from spell 296146    |
| `$<id>h`   | `$327942h`   | Proc chance from spell 327942          |
| `$<id>u`   | `$85739u`    | Max stacks from spell 85739            |
| `$<id>i`   | `$331850i`   | Max targets from spell 331850          |

### Regex Pattern

```regex
\$(\d+)(s|m|M|o|t|a|A|e|w|x|bc|q|d|n|u|h|r|i)(\d)?
```

### Examples

```
"Increases damage by $424509s1% for $214621d."
→ "Increases damage by 10% for 8 sec."
```

---

## 4. Player/Character Variables

| Variable        | Description          | Resolution  |
| --------------- | -------------------- | ----------- |
| `$SP` / `$sp`   | Spell Power          | Player stat |
| `$AP` / `$ap`   | Attack Power         | Player stat |
| `$RAP`          | Ranged Attack Power  | Player stat |
| `$MHP` / `$mhp` | Max Health           | Player stat |
| `$SPS`          | Spell Power (scaled) | Calculated  |
| `$PL` / `$pl`   | Player Level         | Player stat |
| `$INT`          | Intellect            | Player stat |

### Examples

```
"Heals for ${$SP*0.5} health."
→ "Heals for 2500 health." (if SP = 5000)
```

---

## 5. Conditional Expressions

### Basic Conditionals

| Pattern                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `$?s<id>[true][false]`  | If caster knows spell `<id>`                          |
| `$?a<id>[true][false]`  | If caster has aura/buff `<id>`                        |
| `$?c<n>[true][false]`   | If caster is class `<n>` (1=Warrior, 2=Paladin, etc.) |
| `$?pc<id>[true][false]` | If player condition `<id>` is met                     |

### Chained Conditionals

Multiple conditions can be chained:

```
$?a410673[text1]?a383303[text2]?a187880[text3][]
```

Evaluated in order; first matching condition wins, empty `[]` is the fallback.

### OR Conditions

Multiple auras/spells with OR logic:

```
$?a137011|a137034|a137023[value if any][]
```

### Examples

```
"$?s424509[Increases damage by $424509s1%.][.]"
→ "Increases damage by 10%." (if player knows spell 424509)
→ "." (if player doesn't know spell 424509)

"$?c3[Hunters gain][Gain] $s1% bonus."
→ "Hunters gain 5% bonus." (if class is Hunter)
→ "Gain 5% bonus." (otherwise)
```

---

## 6. Math Functions

| Function                 | Description                   | Example                       |
| ------------------------ | ----------------------------- | ----------------------------- |
| `$gt(a,b)`               | Greater than (returns 1 or 0) | `$gt($SP,$AP)`                |
| `$gte(a,b)`              | Greater than or equal         | `$gte($pl,85)`                |
| `$lt(a,b)`               | Less than                     | `$lt($pl,100)`                |
| `$lte(a,b)`              | Less than or equal            | `$lte($s1,50)`                |
| `$cond(test,true,false)` | Ternary conditional           | `$cond($gt($SP,$AP),$SP,$AP)` |
| `$max(a,b)`              | Maximum of two values         | `$max($s1,100)`               |
| `$min(a,b)`              | Minimum of two values         | `$min($pl,60)`                |
| `$clamp(val,min,max)`    | Clamp value to range          | `$clamp($s1,10,25)`           |
| `$floor(n)`              | Floor (round down)            | `$floor($s1/100)`             |

### Examples

```
"${$cond($gt($SP,$AP),$SP*2.52,$AP*2.52)} damage"
→ "12600 damage" (uses higher of SP or AP * 2.52)

"${$clamp($s1,10,25)} sec cooldown"
→ "15 sec cooldown" (clamped between 10-25)
```

---

## 7. Expression Blocks

| Pattern      | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `${expr}`    | Evaluated expression block                                    |
| `$<varname>` | Reference to custom variable from spell_description_variables |

### Custom Variables

Defined in `spell_description_variables.Variables` and linked via `spell_x_description_variables`:

```
$damage=${$cond($gt($SP,$AP),$SP*2,$AP*2)*(1+$@versadmg)}
$healing=${$SP*0.5*(1+$@versadmg)}
```

Then referenced in description:

```
"Deals $<damage> and heals for $<healing>."
```

### Numeric Formatting

Append `.N` for decimal places:

```
${$s1/100}.1  → "15.5" (1 decimal place)
${$s1/100}.2  → "15.50" (2 decimal places)
```

---

## 8. Pluralization / Grammar

| Pattern                  | Example           | Description                         |
| ------------------------ | ----------------- | ----------------------------------- |
| `$l<singular>:<plural>;` | `$lpoint:points;` | Pluralize based on preceding number |
| `$L<singular>:<plural>;` | `$Lstack:stacks;` | Pluralize (capitalized variant)     |

### Examples

```
"Awards $s2 combo $lpoint:points;."
→ "Awards 1 combo point." (if $s2 = 1)
→ "Awards 3 combo points." (if $s2 = 3)

"Summons $s1 $lCompact Harvest Reaper:Compact Harvest Reapers;."
→ "Summons 1 Compact Harvest Reaper."
→ "Summons 2 Compact Harvest Reapers."
```

---

## 9. Gender Forms

| Pattern              | Example      | Description                     |
| -------------------- | ------------ | ------------------------------- |
| `$g<male>:<female>;` | `$ghis:her;` | Gender-based text (lowercase)   |
| `$G<male>:<female>;` | `$Ghim:her;` | Gender-based text (capitalized) |

### Common Gender Forms

| Pattern              | Male    | Female  |
| -------------------- | ------- | ------- |
| `$ghe:she;`          | he      | she     |
| `$ghim:her;`         | him     | her     |
| `$ghis:her;`         | his     | her     |
| `$ghimself:herself;` | himself | herself |

### Examples

```
"Increases $ghis:her; damage by $s1%."
→ "Increases his damage by 10%." (male character)
→ "Increases her damage by 10%." (female character)
```

---

## 10. Special @ Variables

| Variable             | Description                               |
| -------------------- | ----------------------------------------- |
| `$@spelldesc<id>`    | Include another spell's description       |
| `$@spellname<id>`    | Include another spell's name              |
| `$@spellaura<id>`    | Include another spell's aura description  |
| `$@spellicon<id>`    | Spell icon reference                      |
| `$@versadmg`         | Versatility damage multiplier (1 + vers%) |
| `$@class`            | Player's class name                       |
| `$@lootspec`         | Loot specialization name                  |
| `$@currency`         | Currency name                             |
| `$@garrbuilding`     | Garrison building name                    |
| `$@runecarveability` | Runecarving ability reference             |
| `$@traitentryrank`   | Current talent rank                       |
| `$@switch`           | Switch/case expression                    |
| `$@auradesc<id>`     | Aura description from spell               |
| `$@auracaster`       | Aura caster reference                     |

### Examples

```
"$@spelldesc8679"
→ (includes full description of spell 8679)

"${$s1*(1+$@versadmg)} damage"
→ "1150 damage" (with 15% versatility: 1000 * 1.15)
```

---

## 11. Enchant Variables

| Variable | Description               | Source       |
| -------- | ------------------------- | ------------ |
| `$ec1`   | Enchant coefficient/value | Enchant data |
| `$ecix`  | Enchant max item level    | Enchant data |
| `$ecd`   | Enchant duration          | Enchant data |

### Examples

```
"Increases Stamina by $ec1. Cannot be applied to items higher than level $ecix."
→ "Increases Stamina by 15. Cannot be applied to items higher than level 50."
```

---

## 12. Miscellaneous Variables

| Variable      | Description                 |
| ------------- | --------------------------- |
| `$maxcast`    | Max player level for effect |
| `$pctD`       | Percent damage modifier     |
| `$W`, `$W2`   | Weapon damage               |
| `$B`          | Base value                  |
| `$b`          | Text block (rare)           |
| `$ctrmax<id>` | Counter max value           |

---

## 13. UI Formatting Codes

These are WoW client formatting codes, not variables to resolve:

| Pattern       | Description                                 |
| ------------- | ------------------------------------------- |
| `\|cFFRRGGBB` | Start color (hex RGB)                       |
| `\|r`         | Reset color                                 |
| `\|n`         | Newline                                     |
| `\r\n`        | Line break                                  |
| `\|cFFFFFFFF` | White text (common for resource generation) |

### Examples

```
"|cFFFFFFFFGenerates $s2 Holy Power.|r"
→ Displays "Generates 1 Holy Power." in white text
```

---

## Data Source Reference

### Required Tables for Variable Resolution

| Table                           | Variables Resolved                |
| ------------------------------- | --------------------------------- |
| `spell_effect`                  | s, m, M, o, t, a, e, w, x, bc, q  |
| `spell_misc`                    | DurationIndex, RangeIndex         |
| `spell_duration`                | d                                 |
| `spell_range`                   | r                                 |
| `spell_radius`                  | a, A                              |
| `spell_aura_options`            | n, u, h                           |
| `spell_power`                   | p                                 |
| `spell_target_restrictions`     | i                                 |
| `spell_description_variables`   | Custom $<var> definitions         |
| `spell_x_description_variables` | Variable-to-spell mapping         |
| `spell_name`                    | @spellname references             |
| `spell`                         | @spelldesc, @spellaura references |

### Resolution Order

1. Parse expression blocks `${...}`
2. Resolve custom variables `$<varname>` from spell_description_variables
3. Resolve cross-spell references `$<spellID><suffix>`
4. Resolve current spell variables `$s1`, `$d`, etc.
5. Evaluate conditionals `$?...[]`
6. Evaluate math functions `$cond()`, `$max()`, etc.
7. Apply pluralization `$l...:...;`
8. Apply gender forms `$g...:...;`
9. Resolve @ variables `$@spelldesc`, etc.
10. Strip/preserve UI formatting codes

---

## Regex Patterns Summary

```javascript
// Effect variables (current spell)
/\$([sSmMoOtTaAeEwWxXqQ])(\d)/g

// Cross-spell references
/\$(\d+)(s|m|M|o|t|a|A|e|w|x|bc|q|d|n|u|h|r|i|p)(\d)?/gi

// Player stats
/\$(SP|sp|AP|ap|RAP|MHP|mhp|SPS|PL|pl|INT)/g

// Expression blocks
/\$\{([^}]+)\}/g

// Custom variables
/\$<([a-zA-Z][a-zA-Z0-9]*)>/g

// Conditionals
/\$\?([sacp]c?)(\d+)(\|[sacp]c?\d+)*\[([^\]]*)\]\[([^\]]*)\]/g

// Pluralization
/\$[lL]([^:]+):([^;]+);/g

// Gender
/\$[gG]([^:]+):([^;]+);/g

// @ Variables
/\$@([a-zA-Z]+)(\d*)/g

// Math functions
/\$(gt|gte|lt|lte|cond|max|min|clamp|floor)\(([^)]+)\)/g
```
