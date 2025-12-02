# Beast Mastery Hunter Debuffs

Target debuffs applied by BM Hunter abilities.

## Core Debuffs

### Barbed Shot (DoT)
- **Spell ID**: 217200
- **Type**: Bleed/Physical DoT
- **Duration**: 8 seconds
- **Mechanics**:
  - Applied on Barbed Shot cast
  - Ticks deal physical damage
  - Master Handler: Each tick reduces Kill Command CD
  - Multiple can exist (tracked by `min:dot.barbed_shot.remains`)

### Bloodshed
- **Spell ID**: From Bloodshed talent
- **Type**: Bleed DoT
- **Mechanics**:
  - Applied by pet on Bloodshed command
  - Tracked via `hunter_main_pet_base_td_t::dots.bloodshed`

### Serpent Sting
- **Spell ID**: From spec data
- **Type**: Nature DoT
- **Mechanics**:
  - Applied by various abilities (Poisoned Barbs for BM)
  - All Serpent Sting variations use same dot instance

## Dark Ranger Debuffs

### Black Arrow DoT
- **Spell ID**: 468574
- **Type**: Shadow DoT
- **Duration**: From talent data
- **Mechanics**:
  - Hasted ticks: No
  - Shadow Hounds: RPPM proc spawns Dark Hound on tick
  - Umbral Reach: Can spread via Bleak Powder

### Phantom Pain
- **Spell ID**: From talent data
- **Type**: Shadow damage
- **Mechanics**:
  - Replicates Aimed Shot damage to Black Arrow targets
  - Max targets from talent effect #3

## Hero Talent Debuffs

### Wild Instincts
- **Spell ID**: 424567
- **Type**: Damage taken increase
- **Value**: From effect #1
- **Mechanics**: Applied by certain abilities

### Outland Venom
- **Spell ID**: From talent data
- **Type**: Critical damage taken increase
- **Value**: From effect #1
- **Mechanics**: Disable ticking, stacks

## Shared Hunter Debuffs

### Sentinel
- **Spell ID**: 450387
- **Type**: Stacking debuff
- **Mechanics**:
  - Stacks applied by various abilities
  - Sentinel tick damage consumes stacks
  - Overwatch: Can trigger implosion at low health

### Sentinel Tick Target Data
- Tracked via `hunter_td_t::debuffs.sentinel`
- Each tick decrements stacks

### Crescent Steel
- **Spell ID**: 451531
- **Type**: DoT-like effect
- **Mechanics**:
  - Applied when target below health threshold
  - Tick callback adds Sentinel stacks

### Lunar Storm
- **Spell ID**: From talent data
- **Type**: Damage taken increase
- **Schools**: From effect #1
- **Value**: From effect #1
- **Trigger**: Lunar Storm periodic damage

### Kill Zone
- **Spell ID**: From talent data
- **Type**: Damage taken increase
- **Value**: From effect #2
- **Trigger**: Volley damage impacts
- **Notes**: Expires when Volley ends

### Spotter's Mark
- **Spell ID**: From spec data
- **Type**: Damage taken increase (for Aimed Shot)
- **Value**: From effect #1 + Avian Specialization bonus
- **Mechanics**:
  - Consumed by Aimed Shot
  - Triggers On Target buff on consumption

### Ohnahran Winds
- **Spell ID**: From talent data
- **Type**: Damage taken increase
- **Value**: From effect #1 + Avian Specialization bonus
- **Mechanics**: Similar to Spotter's Mark

## Target Data Tracking

The `hunter_td_t` class tracks per-target data:

```cpp
struct hunter_td_t : actor_target_data_t {
  struct cooldowns_t {
    cooldown_t* overwatch;  // Per-target Overwatch ICD
  } cooldowns;

  struct debuffs_t {
    buff_t* wild_instincts;
    buff_t* outland_venom;
    buff_t* kill_zone;
    buff_t* spotters_mark;
    buff_t* ohnahran_winds;
    buff_t* sentinel;
    buff_t* crescent_steel;
    buff_t* lunar_storm;
  } debuffs;

  struct dots_t {
    dot_t* serpent_sting;
    dot_t* a_murder_of_crows;
    dot_t* wildfire_bomb;
    dot_t* black_arrow;
    dot_t* barbed_shot;
    dot_t* explosive_shot;
    dot_t* merciless_blow;
    dot_t* spearhead;
    dot_t* cull_the_herd;
  } dots;

  bool damaged = false;           // For Terms of Engagement
  bool sentinel_imploding = false; // Prevent multiple implosions
};
```

## Pet Target Data

### Main Pet Target Data
```cpp
struct hunter_main_pet_base_td_t : actor_target_data_t {
  struct dots_t {
    dot_t* bloodshed;
  } dots;
};

struct hunter_main_pet_td_t : hunter_main_pet_base_td_t {
  struct debuffs_t {
    buff_t* spearhead;
  } debuffs;
};
```

### Special Pet Target Data

#### Fenryr Target Data
```cpp
struct fenryr_td_t : actor_target_data_t {
  struct dots_t {
    dot_t* ravenous_leap;
  } dots;
};
```

#### Bear Target Data
```cpp
struct bear_td_t : actor_target_data_t {
  struct dots_t {
    dot_t* rend_flesh;
  } dots;
};
```
