# Beast Mastery Hunter Tier Sets

Documentation of TWW Season 3 tier set bonuses for BM Hunter.

## The War Within Season 3 (TWW3)

Season 3 uses **Hero Talent-specific** tier sets instead of spec-specific. BM Hunter can use either **Pack Leader** or **Dark Ranger** sets.

### Dark Ranger Set

#### 2-Piece Bonus

- **Set ID**: `HERO_DARK_RANGER, TWW3, B2`
- **Effect**: See Dark Ranger specific mechanics

#### 4-Piece Bonus

- **Set ID**: `HERO_DARK_RANGER, TWW3, B4`
- **Buff ID**: 1236975
- **Effect**: Kill Shot during Deathblow can grant Blighted Quiver

**Implementation:**

```cpp
// Blighted Quiver chance on Kill Shot during Deathblow
if (specialization() == HUNTER_BEAST_MASTERY)
  blighted_quiver_chance = tier_set.tww_s3_dark_ranger_4pc->effectN(2).percent();

// In execute
if (buffs.deathblow->up() && rng().roll(blighted_quiver_chance))
  buffs.blighted_quiver->trigger();
```

**Blighted Quiver Buff:**

```cpp
buffs.blighted_quiver = make_buff(this, "blighted_quiver",
  tier_set.tww_s3_dark_ranger_4pc_buff);
```

### Pack Leader Set

#### 2-Piece Bonus

- **Set ID**: `HERO_PACK_LEADER, TWW3, B2`
- **Buffs**:
  - Grizzled Fur (Mastery): 1236564
  - Hasted Hooves (Haste): 1236565
  - Sharpened Fangs (Crit): 1236566
- **Effect**: Pack Leader beast summons grant stat buffs

**Implementation:**

```cpp
buffs.grizzled_fur = make_buff(this, "grizzled_fur",
  tier_set.tww_s3_pack_leader_2pc_mastery_buff)
  ->set_default_value_from_effect(1)
  ->set_pct_buff_type(STAT_PCT_BUFF_MASTERY);

buffs.hasted_hooves = make_buff(this, "hasted_hooves",
  tier_set.tww_s3_pack_leader_2pc_haste_buff)
  ->set_default_value_from_effect(1)
  ->set_pct_buff_type(STAT_PCT_BUFF_HASTE);

buffs.sharpened_fangs = make_buff(this, "sharpened_fangs",
  tier_set.tww_s3_pack_leader_2pc_crit_buff)
  ->set_default_value_from_effect(1)
  ->set_pct_buff_type(STAT_PCT_BUFF_CRIT);
```

#### 4-Piece Bonus

- **Set ID**: `HERO_PACK_LEADER, TWW3, B4`
- **Stampede Buff**: 1250068
- **Stampede Damage**: 201594
- **Effect**: Triggers Stampede damage

**Implementation:**

```cpp
struct stampede_t : hunter_ranged_attack_t {
  struct damage_t : public hunter_ranged_attack_t {
    damage_t(util::string_view n, hunter_t* p)
      : hunter_ranged_attack_t(n, p, p->tier_set.tww_s3_pack_leader_4pc_stampede_damage)
    {
      aoe = p->bugs ? -1 : as<int>(p->tier_set.tww_s3_pack_leader_4pc->effectN(3).base_value());
    }
  };

  void tick(dot_t* d) override {
    // Stampede triggers 3 damage events per tick with staggered travel times
    damage->min_travel_time = 0.6;
    damage->execute_on_target(d->target);

    damage->min_travel_time = 0.9;
    damage->execute_on_target(d->target);

    damage->min_travel_time = 1.2;
    damage->execute_on_target(d->target);
  }
};
```

### Sentinel Set (Not BM)

Sentinel set is for Marksmanship and Survival only, not Beast Mastery.

## Tier Set Initialization

```cpp
void hunter_t::init_spells() {
  // TWW Season 3 (Hero Talent based)
  tier_set.tww_s3_dark_ranger_2pc = sets->set(HERO_DARK_RANGER, TWW3, B2);
  tier_set.tww_s3_dark_ranger_4pc = sets->set(HERO_DARK_RANGER, TWW3, B4);
  tier_set.tww_s3_dark_ranger_4pc_buff = tier_set.tww_s3_dark_ranger_4pc.ok()
    ? find_spell(1236975) : spell_data_t::not_found();

  tier_set.tww_s3_pack_leader_2pc = sets->set(HERO_PACK_LEADER, TWW3, B2);
  tier_set.tww_s3_pack_leader_2pc_mastery_buff = tier_set.tww_s3_pack_leader_2pc.ok()
    ? find_spell(1236564) : spell_data_t::not_found();
  tier_set.tww_s3_pack_leader_2pc_haste_buff = tier_set.tww_s3_pack_leader_2pc.ok()
    ? find_spell(1236565) : spell_data_t::not_found();
  tier_set.tww_s3_pack_leader_2pc_crit_buff = tier_set.tww_s3_pack_leader_2pc.ok()
    ? find_spell(1236566) : spell_data_t::not_found();
  tier_set.tww_s3_pack_leader_4pc = sets->set(HERO_PACK_LEADER, TWW3, B4);
  tier_set.tww_s3_pack_leader_4pc_stampede_buff = tier_set.tww_s3_pack_leader_4pc.ok()
    ? find_spell(1250068) : spell_data_t::not_found();
  tier_set.tww_s3_pack_leader_4pc_stampede_damage = tier_set.tww_s3_pack_leader_4pc.ok()
    ? find_spell(201594) : spell_data_t::not_found();
}
```

## APL Tier Set Conditions

The APL uses tier set bonuses in conditions:

```
# TWW S3 4pc Pack Leader optimization
actions.st=bestial_wrath,if=...howl_cooldown...|!set_bonus.tww3_4pc

# Check if tier set is equipped
set_bonus.tww3_4pc  # Returns true if 4pc is active
```
