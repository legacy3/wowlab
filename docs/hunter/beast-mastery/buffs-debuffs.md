# Beast Mastery Buffs & Debuffs

## Player Buffs

### Barbed Shot (Focus Regen)

**Spell ID:** 246152
**Source:** `sc_hunter.cpp:8780-8790`

```cpp
// Max 8 concurrent buff instances
constexpr unsigned BARBED_SHOT_BUFFS_MAX = 8;

// Each buff ticks Focus
buffs.barbed_shot[i]->set_tick_callback(
  [this](buff_t* b, int, timespan_t) {
    resource_gain(RESOURCE_FOCUS, b->default_value,
                  gains.barbed_shot, actions.barbed_shot);
  });
```

| Property       | Value              |
| -------------- | ------------------ |
| Duration       | 8 seconds          |
| Tick interval  | 2 seconds          |
| Focus per tick | 5                  |
| Max stacks     | 8 (separate buffs) |

### Thrill of the Hunt

**Spell ID:** Talent trigger spell
**Source:** `sc_hunter.cpp:8792-8797`

| Property | Value                |
| -------- | -------------------- |
| Effect   | Crit chance increase |
| Stacks   | Up to talent max     |
| Trigger  | Barbed Shot          |

### Bestial Wrath

**Spell ID:** 186254
**Source:** `sc_hunter.cpp:8799-8802`

| Property        | Value                  |
| --------------- | ---------------------- |
| Duration        | 15 seconds             |
| Damage increase | 25% (effectN(1))       |
| Cooldown        | 0 (managed externally) |

### Call of the Wild

**Spell ID:** 359844
**Source:** `sc_hunter.cpp:8804-8837`

| Property      | Value                    |
| ------------- | ------------------------ |
| Duration      | From spell data          |
| Tick callback | Spawns pets, reduces CDs |

### Beast Cleave (Player)

**Spell ID:** 268877
**Source:** `sc_hunter.cpp:8839-8841`

| Property | Value                  |
| -------- | ---------------------- |
| Duration | From talent effectN(2) |
| Trigger  | Multi-Shot             |

### Serpentine Rhythm / Blessing

**Spell IDs:** 468703, 468704
**Source:** `sc_hunter.cpp:8843-8851`

- Rhythm builds stacks from Cobra Shot
- Converts to Blessing at max stacks
- Blessing increases next Cobra Shot damage

### Huntmaster's Call

**Spell ID:** 459731
**Source:** `sc_hunter.cpp:8853-8854`

- Triggers summon of Fenryr or Hati

### Summon Fenryr / Hati

**Spell IDs:** 459735, 459738
**Source:** `sc_hunter.cpp:8856-8865`

| Property  | Fenryr                  | Hati                    |
| --------- | ----------------------- | ----------------------- |
| Stat buff | Haste                   | Mastery                 |
| Duration  | Modified by Dire Frenzy | Modified by Dire Frenzy |

---

## Pet Buffs

### Frenzy

**Spell ID:** 272790
**Source:** `sc_hunter.cpp:2132-2138`

```cpp
buffs.frenzy = make_buff(this, "frenzy", find_spell(272790))
  ->set_default_value_from_effect(1)
  ->modify_default_value(tier_set.tww_s1_bm_2pc->effectN(1).percent())
  ->apply_affecting_aura(talents.savagery)
  ->apply_affecting_aura(talents.better_together)
  ->add_invalidate(CACHE_AUTO_ATTACK_SPEED);
```

| Property               | Value                                 |
| ---------------------- | ------------------------------------- |
| Max stacks             | 3                                     |
| Attack speed per stack | From effectN(1)                       |
| Trigger                | Barbed Shot                           |
| Modified by            | Savagery, Better Together, TWW S1 2pc |

### Pet Thrill of the Hunt

**Spell ID:** 312365
**Source:** `sc_hunter.cpp:2140-2145`

| Property       | Value                  |
| -------------- | ---------------------- |
| Crit per stack | From effectN(1)        |
| Max stacks     | From talent effectN(2) |
| Modified by    | Savagery               |

### Pet Bestial Wrath

**Spell ID:** 186254
**Source:** `sc_hunter.cpp:2147-2159`

```cpp
buffs.bestial_wrath = make_buff(this, "bestial_wrath", find_spell(186254))
  ->set_default_value_from_effect(1)
  ->set_cooldown(0_ms)
  ->set_stack_change_callback([this](buff_t*, int old, int cur) {
    if (cur == 0)
      buffs.piercing_fangs->expire();
    else if (old == 0)
      buffs.piercing_fangs->trigger();
  });
```

| Property        | Value                  |
| --------------- | ---------------------- |
| Damage increase | 25%                    |
| Side effect     | Toggles Piercing Fangs |

### Piercing Fangs

**Spell ID:** 392054
**Source:** `sc_hunter.cpp:2161-2164`

| Property | Value                  |
| -------- | ---------------------- |
| Effect   | Crit damage multiplier |
| Trigger  | Bestial Wrath active   |
| Expire   | Bestial Wrath ends     |

### Beast Cleave (Pet)

**Spell ID:** 118455
**Source:** `sc_hunter.cpp:1755-1779`

```cpp
buffs.beast_cleave = make_buff(this, "beast_cleave", find_spell(118455))
  ->set_duration(0_ms)  // Managed externally
  ->set_default_value(o()->talents.beast_cleave->effectN(1).percent());
```

| Property | Value                     |
| -------- | ------------------------- |
| Cleave % | From talent effectN(1)    |
| Duration | Set by Multi-Shot/ability |

---

## Target Debuffs (DoTs)

### Barbed Shot DoT

**Stored in:** `hunter_td_t::dots.barbed_shot`
**Source:** `sc_hunter.cpp:379`

- Applied by Barbed Shot impact
- Ticks can reduce Kill Command CD (Master Handler)

### Bloodshed DoT

**Spell ID:** 321538
**Stored in:** `hunter_main_pet_base_td_t::dots.bloodshed`
**Source:** `sc_hunter.cpp:2095`

- Applied by pet Bloodshed action
- 10% proc chance per tick for Dire Beast

### Serpent Sting

**Spell ID:** 271788 (BM)
**Stored in:** `hunter_td_t::dots.serpent_sting`

- Can be applied by Poisoned Barbs proc

### Black Arrow (Dark Ranger)

**Spell ID:** 468572
**Stored in:** `hunter_td_t::dots.black_arrow`

- Applied by Black Arrow spell
- Spreads with Phantom Pain

---

## Hero Talent Buffs

### Pack Leader

#### Howl of the Pack Leader Ready Buffs

**Spell IDs:**

- Wyvern: 471878
- Boar: 472324
- Bear: 472325

Indicate which beast will be summoned next.

#### Howl of the Pack Leader Cooldown

**Spell ID:** 471877

Tracks internal cooldown between summons.

#### Lead from the Front

**Spell ID:** 472743
**Source:** `sc_hunter.cpp:9088-9090`

| Property | Value                      |
| -------- | -------------------------- |
| Trigger  | Bestial Wrath cast         |
| Effect   | Empowers next beast summon |

#### Hogstrider

**Spell ID:** 472640
**Source:** `sc_hunter.cpp:9081-9082`

| Property | Value                          |
| -------- | ------------------------------ |
| Effect   | +1 Cobra Shot target per stack |

### Dark Ranger

#### Withering Fire

**Spell ID:** 466991
**Source:** `sc_hunter.cpp:9102-9104`

| Property | Value                |
| -------- | -------------------- |
| Trigger  | Call of the Wild     |
| Effect   | Enhances Black Arrow |

#### The Bell Tolls

**Spell ID:** 1232992
**Source:** `sc_hunter.cpp:9100-9101`

| Property | Value           |
| -------- | --------------- |
| Effect   | Damage modifier |

---

## Buff Tracking Implementation

### Required State per Player

```typescript
interface BeastMasteryBuffState {
  // Player buffs
  barbedShotBuffs: Array<{
    expiresAt: number;
    nextTickAt: number;
  }>; // Max 8
  thrillOfTheHunt: {
    stacks: number;
    expiresAt: number;
  };
  bestialWrath: {
    active: boolean;
    expiresAt: number;
  };
  callOfTheWild: {
    active: boolean;
    expiresAt: number;
    nextTickAt: number;
  };
  beastCleave: {
    expiresAt: number;
  };
  serpentineRhythm: {
    stacks: number;
  };
  serpentineBlessing: {
    active: boolean;
    expiresAt: number;
  };
}
```

### Required State per Pet

```typescript
interface PetBuffState {
  frenzy: {
    stacks: number;
    expiresAt: number;
  };
  thrillOfTheHunt: {
    stacks: number;
    expiresAt: number;
  };
  bestialWrath: {
    active: boolean;
    expiresAt: number;
  };
  piercingFangs: {
    active: boolean; // Follows Bestial Wrath
  };
  beastCleave: {
    expiresAt: number;
  };
}
```

### Required State per Target

```typescript
interface TargetDebuffState {
  barbedShot: {
    active: boolean;
    expiresAt: number;
    nextTickAt: number;
  };
  bloodshed: {
    active: boolean;
    expiresAt: number;
    nextTickAt: number;
  };
  serpentSting: {
    active: boolean;
    expiresAt: number;
  };
}
```
