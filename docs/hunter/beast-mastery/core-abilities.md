# Beast Mastery Core Abilities

## Kill Command

**Spell IDs:** Player (34026), Pet (83381)
**Source:** `sc_hunter.cpp:6947-7234`, `sc_hunter.cpp:2755-2850`

### Mechanics

Kill Command is a player-cast ability that commands the pet to attack. The actual damage is dealt by the pet.

#### Player Execution (`kill_command_t`)

```
On Execute:
1. For each active pet (main + Animal Companion):
   - Execute pet's kill_command action on target
2. If Wildspeaker talented:
   - All active Dire Beasts also execute kill_command
3. Build Tip of the Spear stacks (Survival)
4. Trigger Howl of the Pack Leader consumption
5. Roll for Quick Shot proc (Survival)
6. Roll for Dire Command proc → summon Dire Beast
7. Roll for Deathblow proc
8. Adjust Wildfire Bomb cooldown (Survival)
```

#### Pet Execution (`kill_command_bm_t`)

```
Pet Attack:
- AP Coefficient: 1.035 (from spell data)
- Affected by: Bestial Wrath, Mastery, Training Expert
- Can trigger: Kill Cleave (if Beast Cleave active)
- Can trigger: Wild Instincts debuff
- Can trigger: Phantom Pain replication (Dark Ranger)
```

### Cooldown Modifications

| Source           | Effect                                   |
| ---------------- | ---------------------------------------- |
| Alpha Predator   | +1 charge                                |
| War Orders       | 20% chance to reset on Barbed Shot       |
| Master Handler   | -1s per Barbed Shot tick                 |
| Killer Cobra     | Reset on Cobra Shot during Bestial Wrath |
| Call of the Wild | Percentage reduction on cast/tick        |

---

## Barbed Shot

**Spell ID:** 217200
**Source:** `sc_hunter.cpp:5318-5410`

### Mechanics

Barbed Shot is a DoT that provides Focus regeneration and triggers pet buffs.

#### On Cast

```
1. Find next available Barbed Shot buff slot (max 8)
2. Trigger Barbed Shot Focus regen buff
3. Trigger Thrill of the Hunt (player)
4. Reduce Bestial Wrath cooldown (Barbed Wrath talent)
5. Roll War Orders: 20% chance to reset Kill Command
6. For each active pet:
   - Trigger Stomp (if talented)
   - Trigger Frenzy stack
   - Trigger Thrill of the Hunt (pet)
7. If Brutal Companion: check max Frenzy stacks → bonus attack
```

#### On Impact

```
- Roll Poisoned Barbs chance → apply Serpent Sting to nearby targets
```

#### On Tick

```
- Master Handler: reduce Kill Command cooldown by 1s
```

### Focus Regeneration

Barbed Shot buff (spell 246152):

- Duration: 8 seconds
- Tick interval: 2 seconds
- Focus per tick: 5 (from effectN(1))
- Max concurrent buffs: 8 (separate buff instances)

### Key Interactions

| Talent           | Effect                                  |
| ---------------- | --------------------------------------- |
| Barbed Wrath     | Reduces Bestial Wrath CD by 2s per cast |
| War Orders       | 20% chance to reset Kill Command        |
| Master Handler   | -1s Kill Command CD per tick            |
| Brutal Companion | Bonus pet attack at max Frenzy          |
| Poisoned Barbs   | Chance to apply Serpent Sting AoE       |

---

## Bestial Wrath

**Spell ID:** 186254
**Source:** `sc_hunter.cpp:7238-7311`

### Mechanics

Major cooldown that increases damage for both hunter and pet.

#### On Cast

```
1. Apply Bestial Wrath buff to player
2. For each active pet (main + Animal Companion):
   - Execute pet's Bestial Wrath action
   - Apply Bestial Wrath buff to pet
3. If Wildspeaker:
   - Apply buff to all Dire Beasts
4. If Scent of Blood:
   - Reset Barbed Shot charges (1-2 based on talent)
5. If Lead from the Front:
   - Trigger Lead from the Front buff
   - Trigger Howl of the Pack Leader
6. Tier Set bonuses (TWW S2):
   - 2pc: Cast empowered Barbed Shot
   - 4pc: Trigger Potent Mutagen on pet
```

### Buff Effects

**Player Buff:**

- Damage increase: +25% (effectN(1))
- Duration: 15 seconds

**Pet Buff (spell 186254):**

- Damage increase: +25%
- Triggers Piercing Fangs on apply
- Expires Piercing Fangs on removal

---

## Cobra Shot

**Spell ID:** 193455
**Source:** `sc_hunter.cpp:5238-5314`

### Mechanics

Primary Focus spender and filler ability.

#### On Cast

```
1. If Killer Cobra + Bestial Wrath active:
   - Reset Kill Command cooldown
2. Trigger Serpentine Rhythm stack management
3. Trigger Barbed Scales (reduce Barbed Shot CD)
4. Extend Concussive Shot on target
5. Extend Howl of the Pack Leader cooldown reduction
```

### Focus Cost

- Base cost: 35 Focus
- Modified by: Go for the Throat

### Damage Modifiers

| Source              | Effect                   |
| ------------------- | ------------------------ |
| Hogstrider          | +1 target per stack      |
| Serpentine Blessing | +X% damage at max stacks |

---

## Call of the Wild

**Spell ID:** 359844
**Source:** `sc_hunter.cpp:7315-7354`

### Mechanics

Major cooldown that summons additional pets from stable.

#### On Cast

```
1. Apply Call of the Wild buff to player
2. Spawn stable pets (count from effectN(1))
3. Reduce Kill Command & Barbed Shot CDs by percentage
4. If Bloody Frenzy:
   - Apply Beast Cleave to player, main pet, AC, and CotW pets
5. If Withering Fire (Dark Ranger):
   - Apply Withering Fire buff
```

#### Periodic Tick

```
Every tick:
1. Spawn additional stable pet
2. Reduce Kill Command & Barbed Shot CDs
3. If Bloody Frenzy + Beast Cleave active:
   - Execute Stomp on all pets
   - Refresh Beast Cleave on all pets
```

### Pet Details

- Pet type: `call_of_the_wild_pet_t` (stable_pet_t subclass)
- AP coefficient: 0.6 (inherited from stable_pet)
- Duration: From spell data

---

## Bloodshed

**Spell ID:** 321530 (player), 321538 (pet DoT)
**Source:** `sc_hunter.cpp:7358-7389`, `sc_hunter.cpp:3173-3184`

### Mechanics

Commands pet to apply a bleed DoT with Dire Beast proc chance.

#### Player Cast

```
1. For each active pet (main + AC):
   - Execute pet's Bloodshed action on target
```

#### Pet DoT

- Background action on pet
- Each tick: 10% chance to proc Dire Beast (even if not talented)

---

## Multi-Shot

**Spell ID:** 2643
**Source:** `sc_hunter.cpp:5213-5236`

### Mechanics

AoE ability that triggers Beast Cleave.

#### On Cast

```
1. Trigger Beast Cleave buff on player
2. Trigger Beast Cleave buff on all active pets
3. Duration: from talent effectN(2)
```

### Beast Cleave Effect

- Pet attacks cleave to nearby enemies
- Cleave damage: percentage of original damage
- Affected by: Beast Cleave talent, Kill Cleave talent
