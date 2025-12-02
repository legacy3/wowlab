# Beast Mastery Hunter Hero Talents

BM Hunter has access to two Hero Talent trees: **Pack Leader** and **Dark Ranger**.

## Pack Leader

Pack Leader focuses on summoning powerful beasts that fight alongside you.

### Core Mechanic: Howl of the Pack Leader

The Pack Leader rotation centers around summoning beasts via Kill Command consumption:

```
Kill Command Cast
    └── Check Howl Buff Ready
        └── If Ready: Consume and summon beast
            ├── Wyvern → Damage buff
            ├── Boar → Charge attack + Hogstrider
            └── Bear → Bleed + damage buff
        └── Start Cooldown Buff
            └── On Expire: Ready next beast
```

### Beast Cycle Order
1. **Wyvern** - Grants damage buff (Wyvern's Cry)
2. **Boar** - Charges and hits targets, grants Hogstrider
3. **Bear** - Applies bleed, grants damage buff

### Pack Leader Talents

| Talent | Effect |
|--------|--------|
| **Howl of the Pack Leader** | Kill Command summons beasts |
| **Pack Mentality** | Pet damage increase |
| **Dire Summons** | Reduces Howl CD on Kill Command/Cobra Shot |
| **Better Together** | Increases Frenzy effectiveness |
| **Ursine Fury** | Boar Charge can trigger Mongoose Fury |
| **Envenomed Fangs** | Pet attacks apply nature damage |
| **Fury of the Wyvern** | Kill Command extends Wyvern's Cry |
| **Hogstrider** | Boar Charge stacks increase Cobra Shot |
| **No Mercy** | Kill Shot triggers pet attack |
| **Lead From the Front** | Major CDs grant damage buff |

### Key Buff IDs

| Buff | Spell ID | Effect |
|------|----------|--------|
| Wyvern Ready | From talent | Indicates Wyvern summon ready |
| Boar Ready | From talent | Indicates Boar summon ready |
| Bear Ready | From talent | Indicates Bear summon ready |
| Howl Cooldown | From talent | ICD between summons |
| Wyvern's Cry | From talent | Damage increase |
| Hogstrider | 472640 | Cobra Shot bonus |
| Lead From the Front | 472743 | Damage increase |

### Pack Leader Implementation

```cpp
// Beast summon check on Kill Command
if (consume_howl_of_the_pack_leader(target)) {
  tip_stacks++;  // Bonus Tip of Spear stack
}

// Howl cooldown expiry triggers next beast
buffs.howl_of_the_pack_leader_cooldown->set_stack_change_callback(
  [this](buff_t*, int, int cur) {
    if (cur == 0)
      trigger_howl_of_the_pack_leader();
  });

// Fury of the Wyvern extends Wyvern's Cry
if (state.fury_of_the_wyvern_extension < fury_of_the_wyvern.cap) {
  buffs.wyverns_cry->extend_duration(p(), fury_of_the_wyvern.extension);
  state.fury_of_the_wyvern_extension += fury_of_the_wyvern.extension;
}
```

## Dark Ranger

Dark Ranger transforms the Hunter into a shadow-based archer with Black Arrow mechanics.

### Core Mechanic: Black Arrow

Black Arrow replaces Kill Shot and has different usage conditions:

```
Black Arrow Usability
    ├── Target HP <= 10% (Execute phase)
    ├── Target HP >= 80% (Opener phase)
    └── Deathblow buff active (Any health)

Black Arrow Cast
    ├── Direct damage (Kill Shot base)
    ├── Apply Black Arrow DoT
    │   └── DoT ticks can spawn Shadow Hounds
    ├── Bleak Powder (AoE splash)
    └── Withering Fire (Additional arrows during buff)
```

### Dark Ranger Talents

| Talent | Effect |
|--------|--------|
| **Black Arrow** | Replaces Kill Shot with shadow execute |
| **Bleak Arrows** | Auto Shot replaced, chance for Deathblow |
| **Shadow Hounds** | Black Arrow DoT spawns Dark Hounds |
| **Bleak Powder** | Black Arrow splashes to nearby targets |
| **Umbral Reach** | Bleak Powder spreads Black Arrow DoT |
| **Ebon Bowstring** | Black Arrow can trigger Deathblow |
| **Withering Fire** | Major CDs enable extra Black Arrows |
| **Banshee's Mark** | Black Arrow can summon Murder of Crows |
| **Phantom Pain** | Aimed Shot replicates to Black Arrow targets |
| **The Bell Tolls** | Black Arrow grants damage buff |

### Key Buff/Debuff IDs

| Name | Type | Effect |
|------|------|--------|
| Deathblow | Player Buff | Enables Black Arrow at any health |
| Withering Fire | Player Buff | Extra Black Arrows, Deathblow on tick |
| The Bell Tolls | Player Buff | Damage increase (stacking) |
| Blighted Quiver | Player Buff | Extra Withering Fire arrows |
| Black Arrow DoT | Target DoT | Shadow damage, spawns hounds |

### Dark Ranger Implementation

```cpp
// Deathblow trigger
void trigger_deathblow(bool forced = false) {
  if (forced || !buffs.deathblow->check()) {
    buffs.deathblow->trigger();
    procs.deathblow->occur();
  }
}

// Bleak Arrows auto attack replacement
struct bleak_arrows_t : public auto_shot_base_t {
  void impact(action_state_t* s) override {
    auto_shot_base_t::impact(s);
    if (rng().roll(deathblow_chance))
      p()->trigger_deathblow();
  }
};

// Withering Fire tick callback (BM only)
if (specialization() == HUNTER_BEAST_MASTERY)
  buffs.withering_fire->set_tick_callback(
    [this](buff_t*, int, timespan_t) { trigger_deathblow(); });

// Shadow Hounds RPPM spawn
if (talents.shadow_hounds.ok() && rppm.shadow_hounds->trigger()) {
  pets.dark_hound.spawn(dark_hound_duration);
  pets.dark_hound.active_pets().back()->buffs.beast_cleave->trigger(dark_hound_duration);
}
```

### Dark Ranger APL Differences

The APL has separate action lists for Dark Ranger builds:
- `drst` - Dark Ranger Single Target
- `drcleave` - Dark Ranger Cleave

Key differences:
1. Kill Shot replaced by Black Arrow
2. Priority on maintaining Withering Fire windows
3. Withering Fire tick timing optimization

```
# Dark Ranger ST Priority
actions.drst=kill_shot  # Actually Black Arrow
actions.drst+=/bestial_wrath,if=cooldown.call_of_the_wild.remains>30
actions.drst+=/bloodshed
actions.drst+=/call_of_the_wild
actions.drst+=/kill_command,if=buff.withering_fire.tick_time_remains>gcd
actions.drst+=/barbed_shot,if=buff.withering_fire.tick_time_remains>0.5
actions.drst+=/cobra_shot,if=buff.withering_fire.down
```

## Hero Talent Selection

### Pack Leader Strengths
- Strong sustained damage
- Better AoE with Boar Charge
- Synergy with Frenzy stacking
- More active pet management

### Dark Ranger Strengths
- Strong execute phases
- Shadow Hound spawns add damage
- Withering Fire windows
- More traditional Hunter gameplay

### Build Recommendations

**Pack Leader + Standard BM**
- Better for consistent damage profiles
- Strong with Call of the Wild builds
- Good for Mythic+ with Boar charges

**Dark Ranger + BM**
- Better for execute-heavy fights
- Strong opener (Black Arrow at >80%)
- Good burst windows with Withering Fire
