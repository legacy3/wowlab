# Beast Mastery Hunter Pets

Complete documentation of pet mechanics for BM Hunter.

## Pet Hierarchy

```
hunter_pet_t (Base)
    │
    ├── dark_hound_t (Shadow Hounds - Dark Ranger)
    │
    ├── dire_critter_t (Base for Dire Beasts)
    │   ├── dire_beast_t (Standard Dire Beast)
    │   ├── fenryr_t (Legendary Wolf)
    │   ├── hati_t (Lightning Wolf)
    │   └── bear_t (Pack Leader Bear)
    │
    └── stable_pet_t (Base for Stable Pets)
        ├── call_of_the_wild_pet_t (CotW Summons)
        └── hunter_main_pet_base_t
            ├── animal_companion_t (AC Pet)
            └── hunter_main_pet_t (Main Pet)
```

## Main Pet

### Stats & Scaling
- **AP from Owner AP**: 0.6 (60%)
- **Stamina from Owner**: 0.7 (70%)
- **Armor Multiplier**: 1.05x base
- **Attack Speed**: Configurable via `pet_attack_speed` option

### Actions
- **Basic Attack**: Auto attack damage
- **Kill Command**: Triggered by player Kill Command
- **Kill Cleave**: AoE version with Beast Cleave
- **Bestial Wrath**: Damage during player BW
- **Bloodshed**: Triggered by player Bloodshed
- **Stomp**: Triggered by Barbed Shot (if talented)
- **Flanking Strike**: For Survival
- **Coordinated Assault**: For Survival

### Buffs
- **Frenzy**: Attack speed (3 stacks max)
- **Thrill of the Hunt**: Crit chance
- **Bestial Wrath**: Damage increase
- **Piercing Fangs**: Crit damage (during BW)
- **Beast Cleave**: Enables cleave attacks
- **Solitary Companion**: Damage when no AC
- **Bloodseeker**: Attack speed (Survival)
- **Spearhead**: During Spearhead (Survival)

### Pet Specializations
Pets have specs that grant passive buffs:
- **Ferocity**: Predator's Thirst (Leech)
- **Tenacity**: Endurance Training (Max Health)
- **Cunning**: Pathfinding (Movement Speed)

## Animal Companion

Second permanent pet from Animal Companion talent.

### Differences from Main Pet
- No unique actions (uses same as main pet)
- Does not receive Solitary Companion buff
- Shares most buffs with main pet

### Mechanics
- Summoned automatically with talent
- Executes same abilities as main pet
- Both pets contribute to Frenzy/Beast Cleave

## Dire Beast

### Base Stats
- **Type**: Guardian (dynamic spawn)
- **AP from Owner**: 1.0 (100%)
- **Resource Regen**: Disabled

### Duration Calculation
```cpp
// Duration is based on number of attacks, not fixed time
base_duration = talent_duration + dire_frenzy_extension;
swing_time = 2s * auto_attack_speed;
attacks = base_duration / swing_time;

// Fractional attacks have random chance
if (rng.roll(fractional_part)) {
  attacks += 1;
}

actual_duration = attacks * swing_time;
```

### Mechanics
- Summoned by Dire Beast talent
- Summoned by Dire Command proc (Kill Command)
- Summoned by Bloodshed (replaces Dire Beast)
- Gets Bestial Wrath buff if Wildspeaker talented and BW active
- Gets Beast Cleave if Dire Cleave talented

### Actions
- **Kill Command**: If Wildspeaker talented

## Fenryr (Legendary Wolf)

### Stats
- **AP from Owner**: 2.0 (200% - 2x normal Dire Beast)
- **Type**: Dire Critter variant

### Unique Mechanics
- Summoned via Huntmaster's Call (50% chance at max stacks)
- Grants Haste buff to player while active
- Executes Ravenous Leap on summon

### Actions
- **Ravenous Leap**: Initial attack + DoT

### Target Data
Tracks `ravenous_leap` DoT per target.

## Hati (Lightning Wolf)

### Stats
- **AP from Owner**: 2.0 (200% - 2x normal Dire Beast)
- **Type**: Dire Critter variant

### Unique Mechanics
- Summoned via Huntmaster's Call (50% chance at max stacks)
- Grants damage buff to player while active
- Standard Dire Beast behavior otherwise

## Pack Leader Bear

### Stats
- **AP from Owner**: 1.0 (100%)
- **Auto Attack Multiplier**: 7x
- **Swing Time**: 1.5 seconds (faster than normal)

### Unique Mechanics
- Summoned via Howl of the Pack Leader
- Lead From the Front: Bonus damage if buff active
- Procs Ursine Fury (Mongoose Fury)

### Buffs
- **Bear Summon**: Damage increase
  - Base value + Lead From the Front bonus if active

### Actions
- **Rend Flesh**: DoT applied on summon

### Target Data
Tracks `rend_flesh` DoT per target.

## Pack Leader Boar

### Mechanics
- Summoned via Howl of the Pack Leader
- Executes Boar Charge on summon

### Boar Charge
- Initial impact damage
- Cleave damage to nearby targets
- Hogstrider: Triggers Mongoose Fury chance
- Increments Hogstrider buff stacks

## Pack Leader Wyvern

### Mechanics
- Summoned via Howl of the Pack Leader
- Grants Wyvern's Cry buff to player
- Fury of the Wyvern: Kill Command extends duration

## Dark Hound (Shadow Hounds)

### Stats
- **AP from Owner**: 5.0 (BM) or 6.05 (other specs)
- **Type**: Guardian (dynamic spawn)
- **Resource Regen**: Disabled

### Mechanics
- Spawned via RPPM proc on Black Arrow DoT ticks
- Gets Beast Cleave on spawn for duration
- Immediate attack on summon

## Call of the Wild Pets

### Stats
- **Type**: Stable Pet variant
- **Resource Regen**: Disabled

### Mechanics
- Spawned periodically during Call of the Wild
- Number spawned from CotW effect #1
- Each spawn reduces Kill Command and Barbed Shot CDs
- Bloody Frenzy: All get Beast Cleave for CotW duration
- Execute Stomp during Bloody Frenzy ticks

## Pet Actions Reference

### Kill Command (Pet)
- **Spell ID**: 83381
- **Type**: Special attack
- **Damage**: AP * coefficient * mastery * modifiers
- **Triggers**: Kill Cleave if talented + Beast Cleave active

### Bestial Wrath (Pet)
- **Spell ID**: From pet spell data
- **Type**: Damage attack during BW

### Bloodshed (Pet)
- **Type**: DoT application
- **Target Data**: Tracked in pet TD

### Stomp
- **Type**: AoE damage
- **Trigger**: Barbed Shot cast, CotW tick (Bloody Frenzy)

### Beast Cleave Damage
- **Spell ID**: 118459
- **Type**: Cleave on melee attacks
- **Damage**: Percentage of main attack
- **Targets**: Reduced beyond threshold

### Thundering Hooves
- **Trigger**: Explosive Shot (if talented)
- **Effect**: All active pets charge and deal damage
