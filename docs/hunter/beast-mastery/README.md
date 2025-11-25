# Beast Mastery Hunter - SimC Analysis

This documentation provides a comprehensive analysis of the Beast Mastery Hunter implementation in SimulationCraft, extracted from `third_party/simc/engine/class_modules/sc_hunter.cpp`.

## Overview

Beast Mastery is a pet-focused ranged specialization. The core gameplay loop revolves around:

1. **Bestial Wrath** - Major damage cooldown affecting both hunter and pet
2. **Barbed Shot** - Primary maintenance ability for Frenzy stacks and Focus regeneration
3. **Kill Command** - Core rotational damage ability executed by pets
4. **Cobra Shot** - Focus spender and filler ability

## Key Spell IDs

| Ability          | Player Spell ID | Pet Spell ID  | Notes                   |
| ---------------- | --------------- | ------------- | ----------------------- |
| Kill Command     | 34026           | 83381         | Pet executes the damage |
| Barbed Shot      | 217200          | -             | DoT + Focus regen       |
| Bestial Wrath    | 186254          | 186254 (buff) | Shared buff ID          |
| Cobra Shot       | 193455          | -             | -                       |
| Call of the Wild | 359844          | -             | Summons stable pets     |
| Bloodshed        | 321530          | 321538        | Pet applies DoT         |
| Multi-Shot       | 2643            | -             | Triggers Beast Cleave   |

## Documentation Structure

- [Core Abilities](./core-abilities.md) - Detailed mechanics for each ability
- [Pet System](./pet-system.md) - Pet types, scaling, and actions
- [Talents](./talents.md) - Talent modifiers and spell interactions
- [Buffs & Debuffs](./buffs-debuffs.md) - Tracking requirements
- [Implementation Checklist](./implementation-checklist.md) - WowLab implementation requirements

## SimC Source References

- Main implementation: `third_party/simc/engine/class_modules/sc_hunter.cpp`
- APL: `third_party/simc/ActionPriorityLists/default/hunter_beast_mastery.simc`
- Spell data dump: `third_party/simc/SpellDataDump/hunter.txt`
