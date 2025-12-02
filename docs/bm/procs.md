# Beast Mastery Hunter Procs

Proc mechanics and triggers for BM Hunter.

## Core Procs

### Wild Call

- **Tracked via**: `procs.wild_call`
- **Trigger**: Auto Shot critical strikes
- **Effect**: Resets one charge of Barbed Shot
- **Chance**: From Wild Call talent (typically 20%)
- **Notes**: Critical component of Barbed Shot charge management

### Dire Command

- **Tracked via**: `procs.dire_command`
- **Trigger**: Kill Command cast
- **Effect**: Summons a Dire Beast
- **Chance**: From Dire Command talent effect #1
- **Code Location**: `kill_command_t::execute()`

### War Orders (Kill Command Reset)

- **Tracked via**: Implicit in Barbed Shot
- **Trigger**: Barbed Shot cast
- **Effect**: Resets Kill Command cooldown
- **Chance**: From War Orders talent effect #3
- **Code Location**: `barbed_shot_t::execute()`

### Killer Cobra (Kill Command Reset)

- **Trigger**: Cobra Shot during Bestial Wrath
- **Effect**: Resets Kill Command cooldown
- **Chance**: 100% during Bestial Wrath
- **Condition**: `talents.killer_cobra.ok() && buffs.bestial_wrath->check()`

## Dark Ranger Procs

### Deathblow

- **Tracked via**: `procs.deathblow`
- **Trigger**: Multiple sources:
  - Kill Command (chance from Deathblow talent)
  - Bleak Arrows auto attacks
  - Withering Fire buff ticks (BM only)
  - Ebon Bowstring (on Black Arrow cast)
- **Effect**: Enables Kill Shot/Black Arrow at any health
- **BM Chance**: From `deathblow.chance` (effect #2 for BM)

### Blighted Quiver (TWW S3)

- **Tracked via**: `buffs.blighted_quiver`
- **Trigger**: Kill Shot during Deathblow
- **Effect**: Additional Withering Fire arrows
- **Chance**: From tier set effect

### Shadow Hounds

- **Type**: RPPM (Real Procs Per Minute)
- **Trigger**: Black Arrow DoT ticks
- **Effect**: Spawns Dark Hound pet
- **Duration**: From Shadow Hounds talent

## Pack Leader Procs

### Huntmaster's Call (Hati/Fenryr)

- **Tracked via**: `buffs.huntmasters_call`
- **Trigger**: Dire Beast summon
- **Effect**: At max stacks, 50% chance for Fenryr or Hati
- **Mechanics**:
  ```cpp
  if (buffs.huntmasters_call->at_max_stacks()) {
    buffs.huntmasters_call->expire();
    if (rng().roll(0.5)) {
      // Summon Fenryr
    } else {
      // Summon Hati
    }
  }
  ```

### Howl of the Pack Leader

- **Trigger**: Cooldown buff expires
- **Effect**: Readies next beast summon (Wyvern/Boar/Bear)
- **Mechanics**: Cycles through beasts in order

### Ursine Fury (Mongoose Fury from Bear)

- **Tracked via**: Implicit in Boar Charge
- **Trigger**: Boar Charge damage
- **Effect**: Triggers Mongoose Fury buff
- **Chance**: From Ursine Fury talent effect #1

### Hogstrider Stacks

- **Trigger**: Boar Charge impacts
- **Effect**: Cobra Shot hits more targets, deals more damage
- **Mechanics**: Increments on each Boar Charge impact

## Tier Set Procs (TWW S3)

### Pack Leader 2pc

- **Trigger**: Pack Leader beast summons
- **Effect**: Grants one of three stat buffs:
  - Grizzled Fur (Mastery)
  - Hasted Hooves (Haste)
  - Sharpened Fangs (Crit)

### Pack Leader 4pc (Stampede)

- **Trigger**: Specific Pack Leader conditions
- **Effect**: Triggers Stampede damage

### Dark Ranger 4pc

- **Trigger**: Kill Shot during Deathblow
- **Effect**: Chance to gain Blighted Quiver
- **Chance**: From tier set effect #2 (BM) or #3 (MM)

## Snakeskin Quiver Proc

- **Tracked via**: `procs.snakeskin_quiver`
- **Trigger**: Various conditions per talent
- **Effect**: Free Cobra Shot
- **Action**: `actions.snakeskin_quiver->execute()`

## Proc Implementation Pattern

```cpp
// Typical proc check pattern
if (rng().roll(proc_chance)) {
  // Trigger effect
  procs.proc_name->occur();  // Track proc occurrence
  // Execute associated action or buff
}

// RPPM pattern
if (rppm.effect_name->trigger()) {
  // Trigger effect
}
```

## Proc Tracking in SimC

Procs are tracked via the `proc_t` class:

```cpp
void hunter_t::init_procs() {
  if (talents.dire_command.ok())
    procs.dire_command = get_proc("Dire Command");

  if (talents.wild_call.ok())
    procs.wild_call = get_proc("Wild Call");

  if (talents.deathblow.ok())
    procs.deathblow = get_proc("Deathblow");
  // ... etc
}
```

Procs report in simulation output:

- Total occurrences
- Procs per minute (PPM)
- Procs per execute (PPE)
