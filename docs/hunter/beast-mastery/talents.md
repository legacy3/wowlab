# Beast Mastery Talents & Spell Interactions

## Class Talents (Shared)

### Kill Shot

**Spell ID:** Various per spec

- Execute ability usable below 20% health
- Deathblow talent can proc above threshold

### Deathblow

**Spell IDs:** Talent, Buff (deathblow_buff)

- Chance to proc Kill Shot availability
- BM: effectN(2) percent chance from Kill Command
- SV: effectN(3) percent + Sic 'Em + Born to Kill bonuses

### Alpha Predator

**Effect:** +1 Kill Command charge

- Applies to both BM and SV
- `cooldown->charges += talent->effectN(1).base_value()`

**Source:** `sc_hunter.cpp:7022`

---

## Beast Mastery Spec Talents

### Tier 1-2

#### Cobra Shot

- Primary Focus spender
- Replaces Arcane Shot for BM

#### Animal Companion

- Summons secondary permanent pet
- Pet inherits all main pet mechanics

#### Solitary Companion

- Alternative to Animal Companion
- Increases main pet damage when alone

#### Barbed Shot

- Core rotational ability
- Triggers Frenzy on pet

---

### Tier 3-4

#### Pack Tactics

- Increases Focus regeneration
- `resources.base_regen_per_second *= 1 + effectN.percent()`

#### Aspect of the Beast

- Enhances pet family abilities
- Modifies Endurance Training, Pathfinding, Predator's Thirst

#### War Orders

**Effect:** 20% chance for Barbed Shot to reset Kill Command

```cpp
if (rng().roll(p()->talents.war_orders->effectN(3).percent()))
  p()->cooldowns.kill_command->reset(true);
```

**Source:** `sc_hunter.cpp:5374-5375`

#### Thrill of the Hunt

**Buff ID:** 312365

- Barbed Shot triggers crit chance buff
- Stacks up to talent max (effectN(2))
- Affects both player and pet

---

### Tier 5-6

#### Go for the Throat

- Pet basic attacks generate Focus for hunter
- Reduces Cobra Shot cost

#### Multi-Shot

**Spell ID:** 2643

- Triggers Beast Cleave on pets
- Required for AoE rotation

#### Laceration

**Spell IDs:** 459555 (driver), 459560 (bleed)

- Kill Command applies bleed DoT
- Residual damage based on Kill Command damage

#### Beast Cleave

**Buff ID:** 268877 (player), 118455 (pet)

- Pet attacks cleave nearby enemies
- Duration from Multi-Shot cast
- Extended by various talents

#### Wild Call

**Effect:** Auto Shot crits reset Barbed Shot

```cpp
// In auto_shot impact
if (result_is_hit(s->result) && s->result == RESULT_CRIT) {
  if (rng().roll(p()->talents.wild_call->proc_chance())) {
    p()->cooldowns.barbed_shot->reset(true);
    p()->procs.wild_call->occur();
  }
}
```

**Source:** `sc_hunter.cpp:4027-4069`

#### Hunter's Prey

- Kill Command has chance to reset
- Hidden buff tracking (468219)

#### Poisoned Barbs

**Spell ID:** 1217549

- Barbed Shot has chance to apply Serpent Sting AoE
- `aoe = -1`, `reduced_aoe_targets` from talent

---

### Tier 7-8

#### Stomp

**Spell IDs:** 1217528 (primary), 201754 (cleave)

- Pet stomps on Barbed Shot cast
- AoE damage ability

#### Serpentine Rhythm

**Buff IDs:** 468703, 468704 (blessing)

- Cobra Shot builds stacks
- At max stacks, converts to Serpentine Blessing

#### Kill Cleave

- Kill Command cleaves during Beast Cleave
- Percentage of original damage

#### Training Expert

- Flat pet damage increase
- `owner_coeff` modifier

#### Dire Beast

**Spell ID:** 219199 (summon)

- Summons temporary beast
- Duration modified by haste

---

### Tier 9-10

#### Savagery

- Increases Frenzy and Thrill of the Hunt effects
- Applies via `apply_affecting_aura`

#### Bestial Wrath

**Spell ID:** 186254

- Major cooldown
- +25% damage to hunter and pet

#### Dire Command

**Effect:** Kill Command has chance to summon Dire Beast

```cpp
if (p()->actions.dire_beast && rng().roll(dire_command.chance)) {
  p()->actions.dire_beast->execute();
  p()->procs.dire_command->occur();
}
```

**Source:** `sc_hunter.cpp:7118-7122`

#### Huntmaster's Call

- Summons Fenryr or Hati
- Special legendary pets with unique abilities

#### Dire Cleave

- Dire Beasts gain Beast Cleave on summon
- Duration from talent effectN(2)

---

### Tier 11-12

#### Killer Instinct

- Kill Command deals increased damage to low health targets

#### Master Handler

**Effect:** Barbed Shot ticks reduce Kill Command CD

```cpp
void tick(dot_t* d) override {
  hunter_ranged_attack_t::tick(d);
  if (p()->talents.master_handler->ok()) {
    p()->cooldowns.kill_command->adjust(
      -p()->talents.master_handler->effectN(1).time_value()
    );
  }
}
```

**Source:** `sc_hunter.cpp:5401-5408`

#### Barbed Wrath

**Effect:** Barbed Shot reduces Bestial Wrath cooldown

```cpp
bestial_wrath_reduction = p->talents.barbed_wrath->effectN(1).time_value();
// In execute:
p()->cooldowns.bestial_wrath->adjust(-bestial_wrath_reduction);
```

**Source:** `sc_hunter.cpp:5349, 5372`

#### Thundering Hooves

- Explosive Shot deals increased damage
- Pets gain movement speed

#### Dire Frenzy

- Dire Beast duration/damage increase
- Modifies Fenryr/Hati buffs

---

### Tier 13-14 (Capstones)

#### Call of the Wild

**Spell ID:** 359844

- Summons multiple stable pets
- Periodic cooldown reduction

#### Killer Cobra

**Effect:** Cobra Shot resets Kill Command during Bestial Wrath

```cpp
if (p()->talents.killer_cobra.ok() && p()->buffs.bestial_wrath->check())
  p()->cooldowns.kill_command->reset(true);
```

**Source:** `sc_hunter.cpp:5261-5262`

#### Scent of Blood

**Effect:** Bestial Wrath grants Barbed Shot charges

```cpp
if (p()->talents.scent_of_blood.ok())
  p()->cooldowns.barbed_shot->reset(true,
    as<int>(p()->talents.scent_of_blood->effectN(1).base_value()));
```

**Source:** `sc_hunter.cpp:7285-7286`

#### Brutal Companion

**Effect:** At max Frenzy, pet does bonus attack

```cpp
if (pet->buffs.frenzy->check() ==
    as<int>(p()->talents.brutal_companion->effectN(1).base_value())) {
  pet->actions.brutal_companion_ba->execute_on_target(target);
}
```

**Source:** `sc_hunter.cpp:5386-5390`

#### Bloodshed

**Spell ID:** 321530

- Pet applies bleed DoT
- 10% chance per tick to proc Dire Beast

---

## Hero Talents

### Pack Leader (BM/SV)

#### Howl of the Pack Leader

**Buff IDs:** 471878 (wyvern), 472324 (boar), 472325 (bear), 471877 (cooldown)

- Rotates through three beast summons
- Triggered by Kill Command consumption

#### Lead from the Front

**Buff ID:** 472743

- Triggered by Bestial Wrath
- Empowers next beast summon

#### No Mercy

- Kill Command damage bonus during Bestial Wrath

### Dark Ranger (BM/MM)

#### Black Arrow

**Spell IDs:** 466930 (spell), 468572 (DoT)

- Replaces Kill Shot
- DoT with spread mechanics

#### Withering Fire

**Buff ID:** 466991

- Triggered by Call of the Wild
- Enhances Black Arrow

---

## Talent Implementation Patterns

### Cooldown Modification

```typescript
// Pattern: Reduce cooldown
cooldown.adjust(-talentEffect.timeValue());

// Pattern: Reset cooldown
cooldown.reset(true);

// Pattern: Add charges
cooldown.charges += talentEffect.baseValue();
```

### Proc Triggers

```typescript
// Pattern: Roll for proc
if (rng.roll(talent.effectN(n).percent())) {
  triggerProc();
}
```

### Buff Application

```typescript
// Pattern: Apply affecting aura
buff.applyAffectingAura(talent);
buff.modifyDefaultValue(talentEffect.percent());
```
