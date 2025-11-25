# Beast Mastery Pet System

## Pet Hierarchy

SimC implements a clear pet class hierarchy for Hunter:

```
hunter_pet_t (base)
├── stable_pet_t
│   ├── hunter_main_pet_base_t
│   │   ├── hunter_main_pet_t (main pet)
│   │   └── animal_companion_t
│   └── call_of_the_wild_pet_t
└── dire_critter_t
    ├── dire_beast_t
    ├── dark_hound_t
    ├── fenryr_t
    ├── hati_t
    └── bear_t
```

**Source:** `sc_hunter.cpp:1700-2250`

---

## Main Pet (`hunter_main_pet_t`)

The primary pet that is always active for BM hunters.

### Stats & Scaling

| Stat               | Value               | Source                             |
| ------------------ | ------------------- | ---------------------------------- |
| AP from owner AP   | 0.6 (60%)           | `owner_coeff.ap_from_ap = 0.6`     |
| Stamina from owner | 70%                 | `stamina_per_owner = 0.7`          |
| Armor multiplier   | 1.05x               | `initial.armor_multiplier *= 1.05` |
| Attack speed       | 2.0s (configurable) | `pet_attack_speed` option          |

### Actions

```cpp
struct actions_t {
  action_t* kill_command;    // Kill Command execution
  action_t* kill_cleave;     // Kill Cleave (if Beast Cleave active)
  action_t* bestial_wrath;   // Bestial Wrath attack
  action_t* bloodshed;       // Bloodshed DoT
};
```

### Buffs

```cpp
struct buffs_t {
  buff_t* frenzy;            // Attack speed buff from Barbed Shot
  buff_t* thrill_of_the_hunt; // Crit chance buff
  buff_t* bestial_wrath;     // Damage multiplier
  buff_t* piercing_fangs;    // Crit damage during Bestial Wrath
  buff_t* beast_cleave;      // Cleave damage
};
```

**Source:** `sc_hunter.cpp:2101-2200`

---

## Animal Companion

Secondary permanent pet for hunters with the Animal Companion talent.

### Implementation

- Subclass of `hunter_main_pet_base_t`
- Inherits all buffs and actions from main pet
- Resource regeneration disabled

### Key Behavior

- Iterated alongside main pet in most BM abilities
- Pattern: `pets::active<hunter_main_pet_base_t>(pets.main, pets.animal_companion)`

**Source:** `sc_hunter.cpp:2230-2260`

---

## Dire Beast (`dire_beast_t`)

Temporary pet summoned by Dire Beast talent or Dire Command procs.

### Stats & Scaling

| Stat             | Value          | Notes                 |
| ---------------- | -------------- | --------------------- |
| AP from owner AP | 1.0 (100%)     | Buffed in patch notes |
| Duration         | Haste-affected | From talent data      |
| Type             | Guardian       | Not permanent         |

### Buffs

```cpp
struct buffs_t {
  buff_t* bestial_wrath;  // If Wildspeaker talented
};
```

### Wildspeaker Integration

- Receives Bestial Wrath buff if player has it active on summon
- Can execute Kill Command if Wildspeaker talented

**Source:** `sc_hunter.cpp:1818-1890`

---

## Call of the Wild Pets (`call_of_the_wild_pet_t`)

Pets summoned during Call of the Wild.

### Stats & Scaling

- Inherits from `stable_pet_t`
- Same scaling as main pet (60% AP)
- Resource regeneration disabled

### Behavior

- Spawned via `pets.cotw_stable_pet.spawn(duration, count)`
- Can receive Beast Cleave if Bloody Frenzy talented
- Execute Stomp on spawn (if talented)

**Source:** `sc_hunter.cpp:2070-2084`

---

## Special Dire Critters

### Fenryr

- Summoned by Huntmaster's Call
- AP coefficient: 2.0x (double normal Dire Beast)
- Has special `ravenous_leap` action on summon

### Hati

- Summoned by Huntmaster's Call
- AP coefficient: 2.0x
- Grants player haste buff while active

### Bear (Pack Leader)

- Summoned by Howl of the Pack Leader
- Has `rend_flesh` bleed attack
- Damage bonus from Lead from the Front

**Source:** `sc_hunter.cpp:1906-2041`

---

## Pet Damage Calculation

### Base Formula

```
pet_damage = base_damage * owner_ap * ap_coefficient * mastery * buffs
```

### Damage Multipliers

1. **Mastery: Master of Beasts** (spell 76657)
   - Flat percentage increase to pet damage
   - Scales with mastery rating

2. **Bestial Wrath**
   - +25% damage when active on pet

3. **Training Expert** (talent)
   - Percentage increase to pet damage

4. **Piercing Fangs** (during Bestial Wrath)
   - Increased critical strike damage

### Attack Speed Calculation

```cpp
double composite_melee_auto_attack_speed() const {
  double ah = base_attack_speed;

  // Frenzy stacks
  if (buffs.frenzy->check())
    ah /= 1 + buffs.frenzy->check_stack_value();

  return ah;
}
```

**Source:** `sc_hunter.cpp:2167-2175`

---

## Pet Action Execution Pattern

Most BM abilities follow this pattern:

```cpp
void execute() override {
  // 1. Execute player spell
  hunter_spell_t::execute();

  // 2. Command pets to act
  for (auto pet : pets::active<hunter_main_pet_base_t>(
      p()->pets.main,
      p()->pets.animal_companion)) {
    pet->actions.ability->execute_on_target(target);
  }

  // 3. Handle Wildspeaker dire beasts
  if (p()->talents.wildspeaker.ok()) {
    for (auto pet : p()->active_pets) {
      dire_critter_t* dc = dynamic_cast<dire_critter_t*>(pet);
      if (dc)
        dc->actions.ability->execute_on_target(target);
    }
  }
}
```

---

## Implementation Requirements for WowLab

### Pet Entity

```typescript
interface Pet {
  id: UnitID;
  ownerId: UnitID;
  type: "main" | "animal_companion" | "dire_beast" | "cotw";

  // Scaling
  apCoefficient: number;

  // Buffs
  frenzyStacks: number;
  bestialWrathActive: boolean;
  beastCleaveExpiry: number;
  thrillOfTheHuntStacks: number;

  // Actions
  actions: {
    killCommand: SpellID;
    basicAttack: SpellID;
    bloodshed?: SpellID;
  };
}
```

### Pet Manager Service

```typescript
interface PetManager {
  getActivePets(ownerId: UnitID): Pet[];
  spawnPet(type: PetType, duration: number): Pet;
  despawnPet(petId: UnitID): void;

  // Buff management
  applyFrenzy(petId: UnitID): void;
  applyBeastCleave(petId: UnitID, duration: number): void;
}
```
