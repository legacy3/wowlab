# Beast Mastery Hunter Spells

Complete list of BM Hunter spells with mechanics and spell IDs.

## Core Rotational Abilities

### Kill Command
- **Spell ID**: 34026
- **Type**: Pet ability trigger
- **Focus Cost**: 30
- **Cooldown**: 7.5 seconds (2 charges with Alpha Predator)
- **Range**: 50 yards (pet must be in range)
- **Mechanics**:
  - Commands pet to attack target
  - Pet spell ID for damage: 83381
  - Affected by Mastery: Master of Beasts
  - Can reset Kill Command CD via Killer Cobra during Bestial Wrath
  - Triggers Dire Command procs
  - Triggers Deathblow procs (Dark Ranger)
  - Extends Wyvern's Cry duration (Pack Leader)

### Barbed Shot
- **Spell ID**: 217200
- **Type**: Ranged attack with DoT
- **Focus Cost**: 0 (generates Focus via buff)
- **Cooldown**: 12 seconds (2 charges base)
- **Range**: 40 yards
- **Mechanics**:
  - Applies bleed DoT to target
  - Grants Barbed Shot buff to player (Focus regen)
  - Triggers Frenzy stack on pet (ID: 272790)
  - Triggers Thrill of the Hunt buff
  - Reduces Bestial Wrath cooldown (Barbed Wrath talent)
  - War Orders: Chance to reset Kill Command
  - Stomp triggers on cast (if talented)
  - Brutal Companion BA at 3 Frenzy stacks

**Barbed Shot Player Buff (ID: 246152)**
- Duration: 8 seconds
- Regenerates Focus over duration
- Multiple buffs can exist simultaneously

### Cobra Shot
- **Spell ID**: 193455
- **Type**: Ranged attack
- **Focus Cost**: 35
- **Cast Time**: Instant
- **Range**: 40 yards
- **Mechanics**:
  - Reduces Kill Command cooldown by 1 second
  - Killer Cobra: Resets Kill Command during Bestial Wrath
  - Serpentine Rhythm: Stacks buff, converts to Serpentine Blessing at max
  - Barbed Scales: Reduces Barbed Shot cooldown
  - Hogstrider: Increases targets hit based on stacks

**Cobra Shot Snakeskin Quiver (Background)**
- Triggered by Snakeskin Quiver talent
- Free Cobra Shot on proc

### Multi-Shot (BM)
- **Spell ID**: 2643 (BM variant)
- **Type**: AoE ranged attack
- **Focus Cost**: 40
- **Range**: 40 yards
- **Mechanics**:
  - Hits all enemies in area
  - Triggers Beast Cleave buff on player and pets
  - Reduced damage beyond 5 targets

## Major Cooldowns

### Bestial Wrath
- **Spell ID**: 19574
- **Type**: Offensive cooldown
- **Cooldown**: 90 seconds
- **Duration**: 15 seconds
- **Mechanics**:
  - Increases damage dealt by Hunter and pet
  - Buff value from effect #1
  - Pet gets separate Bestial Wrath buff (ID: 186254)
  - Scent of Blood: Resets Barbed Shot charges
  - Killer Cobra: Cobra Shot resets Kill Command
  - Lead From the Front: Triggers on cast (Pack Leader)

### Call of the Wild
- **Spell ID**: 359844 (talent), 206332 (buff/effect)
- **Type**: Major cooldown
- **Cooldown**: 180 seconds
- **Duration**: 20 seconds
- **Mechanics**:
  - Summons pets from stable
  - Each tick summons an additional pet
  - Reduces Kill Command and Barbed Shot CDs during
  - Bloody Frenzy: Applies Beast Cleave for duration
  - Triggers Withering Fire (Dark Ranger)

### Bloodshed
- **Spell ID**: 321538
- **Type**: Pet command
- **Cooldown**: 60 seconds
- **Mechanics**:
  - Commands pet to attack with increased damage
  - Applied as DoT/bleed on target
  - Pet executes Bloodshed attack

## Utility/Situational Spells

### Kill Shot
- **Spell ID**: 53351
- **Type**: Execute
- **Focus Cost**: 10
- **Cooldown**: 10 seconds
- **Health Threshold**: 20%
- **Mechanics**:
  - Usable on targets below 20% health
  - Deathblow buff allows use at any health
  - Hunter's Prey: Damage increased per active pet
  - Sic 'Em: Hits additional targets during Deathblow

### Black Arrow (Dark Ranger replacement for Kill Shot)
- **Spell ID**: 466930 (main), 468574 (DoT)
- **Type**: Execute with DoT
- **Mechanics**:
  - Replaces Kill Shot when talented
  - Applies DoT that can spawn Shadow Hounds
  - Lower threshold (10%) and upper threshold (80%)
  - Usable at low or high health
  - Bleak Powder: Cleave damage on impact
  - Withering Fire: Additional Black Arrows during buff

### Counter Shot
- **Spell ID**: 147362
- **Type**: Interrupt
- **Cooldown**: 24 seconds
- **Range**: 40 yards
- **Mechanics**: Interrupts spellcasting

### Explosive Shot
- **Spell ID**: 212431 (cast), 212680 (damage)
- **Type**: AoE damage
- **Focus Cost**: 20
- **Cooldown**: 30 seconds
- **Mechanics**:
  - Places explosive on target
  - Detonates after delay or on reapplication
  - Thundering Hooves: Pets charge and deal damage

## Auto Attack

### Auto Shot
- **Spell ID**: 75
- **Type**: Auto attack
- **Mechanics**:
  - Automatic ranged attacks
  - Wild Call procs reset Barbed Shot
  - Bleak Arrows: Replaced auto shot (Dark Ranger)

### Bleak Arrows (Dark Ranger)
- **Spell ID**: 468572
- **Type**: Replacement auto shot
- **Mechanics**:
  - Replaces Auto Shot with Black Arrow talent
  - Chance to trigger Deathblow on impact

## Pet Commands

### Summon Pet / Call Pet
- **Spell ID**: 883
- **Type**: Pet summon
- **Mechanics**: Summons your active pet

### Mend Pet
- **Spell ID**: 136
- **Type**: Pet heal
- **Mechanics**: Heals pet over time
