# Beast Mastery Hunter Overview

## Spec Identity

Beast Mastery (BM) Hunter is a ranged DPS specialization that commands powerful beasts to deal the majority of its damage. Unlike other Hunter specs, BM can cast all abilities while moving and relies heavily on pet damage.

## Core Mechanics

### Mastery: Master of Beasts
- **Spell ID**: 76657
- Increases damage done by your pets
- Affects all pet damage including Kill Command, basic attacks, and Beast Cleave

### Focus System
- **Base Focus**: 100
- **Regen Rate**: 5 Focus/second (base)
- Primary spenders: Cobra Shot (35), Kill Command (30)
- Primary generator: Barbed Shot (generates over time via buff)

### Pet Frenzy System
The Frenzy mechanic is central to BM gameplay:

```
Barbed Shot Cast
    └── Triggers Frenzy buff on Main Pet
        └── Stacks up to 3 times
        └── Each stack increases pet attack speed
        └── Duration refreshes on new Barbed Shot
```

**Frenzy Buff (ID: 272790)**
- Attack speed increase per stack (base 10%)
- Can stack to 3
- Modified by talents (Savagery, Better Together)

### Beast Cleave System
When Multi-Shot is cast, Beast Cleave is applied:
- **Player Buff (ID: 268877)**: Enables player cleave damage
- **Pet Buff (ID: 118455)**: Pet melee attacks cleave nearby targets
- **Pet Cleave Damage (ID: 118459)**: The actual cleave damage
- Duration set by Beast Cleave talent

## Damage Flow

```
Hunter Actions
    │
    ├── Kill Command ──────► Pet Kill Command ──► Direct Damage
    │                                          └── Kill Cleave (if talented)
    │
    ├── Barbed Shot ────────► Direct Damage (DoT on target)
    │                       └── Frenzy Stack (Pet)
    │                       └── Focus Regen Buff (Player)
    │
    ├── Cobra Shot ─────────► Direct Damage
    │                       └── Kill Command CD Reduction
    │
    ├── Multi-Shot ─────────► Direct Damage (AoE)
    │                       └── Beast Cleave Buff
    │
    └── Bestial Wrath ──────► Damage Buff (Player + Pet)
                            └── Scent of Blood: Reset Barbed Shot
```

## Key Cooldowns

### Bestial Wrath
- **Spell ID**: 19574
- Major damage cooldown
- Affects both Hunter and pets
- Duration: 15 seconds
- Cooldown: 90 seconds (reducible)

### Call of the Wild
- **Spell ID**: 359844
- Summons additional pets from stable
- Reduces Kill Command and Barbed Shot CDs while active
- Activates Bloody Frenzy (permanent Beast Cleave during)

## Stat Priority (General)
1. Haste (more Barbed Shots, faster Kill Commands)
2. Critical Strike
3. Mastery
4. Versatility

## Playstyle Summary

BM Hunter gameplay revolves around:

1. **Frenzy Maintenance**: Always keep 3 stacks of Frenzy via Barbed Shot
2. **Cooldown Alignment**: Sync Bestial Wrath with Call of the Wild when possible
3. **Kill Command Priority**: Use on cooldown, optimize with Killer Cobra resets
4. **Focus Management**: Don't cap Focus, but maintain enough for Kill Command
5. **Barbed Shot Flow**: Don't waste charges, but prioritize Frenzy uptime
