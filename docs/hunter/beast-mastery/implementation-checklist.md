# Beast Mastery Implementation Checklist

This checklist outlines what needs to be implemented in WowLab packages to properly support Beast Mastery Hunter simulation.

## Current State (apps/standalone)

The current `beast-mastery.ts` rotation has basic spell casting:

```typescript
// Current implementation - VERY BASIC
yield * rotation.spell.cast(playerId, 186254); // Bestial Wrath
yield * rotation.spell.cast(playerId, 217200); // Barbed Shot
yield * rotation.spell.cast(playerId, 34026); // Kill Command
yield * rotation.spell.cast(playerId, 193455); // Cobra Shot
```

**Missing:** All spell interactions, pet system, buff tracking, talent modifiers.

---

## Phase 1: Core Entity Extensions

### 1.1 Pet Entity (packages/wowlab-core)

- [ ] Create `Pet` entity extending `Unit`
- [ ] Add pet-specific properties:
  - `ownerId: UnitID`
  - `petType: 'main' | 'animal_companion' | 'dire_beast' | 'cotw'`
  - `apCoefficient: number`
- [ ] Add pet buff tracking:
  - `frenzyStacks: number`
  - `beastCleaveExpiry: number`

### 1.2 Extended Buff System

- [ ] Support multiple concurrent buff instances (Barbed Shot x8)
- [ ] Add tick callbacks for periodic buffs
- [ ] Add stack-based buffs with overflow handling

### 1.3 Spell Modifier Extensions

Current `SpellModifier` interface needs:

- [ ] `onTick` callback for DoT/buff ticks
- [ ] `beforeDamage` for damage modification
- [ ] `onPetAction` for pet ability triggers
- [ ] `onCooldownReset` for proc tracking

---

## Phase 2: Pet System (packages/wowlab-services)

### 2.1 Pet Manager Service

```typescript
interface PetManager {
  // Lifecycle
  spawnPet(ownerId: UnitID, type: PetType, duration?: number): Effect<Pet>;
  despawnPet(petId: UnitID): Effect<void>;

  // Queries
  getActivePets(ownerId: UnitID): Effect<Pet[]>;
  getMainPet(ownerId: UnitID): Effect<Pet | null>;
  getAnimalCompanion(ownerId: UnitID): Effect<Pet | null>;

  // Actions
  commandPetAction(
    petId: UnitID,
    spellId: SpellID,
    target: UnitID,
  ): Effect<void>;
}
```

- [ ] Implement `PetManagerService`
- [ ] Integrate with existing `StateService`
- [ ] Add pet spawning/despawning logic
- [ ] Implement pet action execution

### 2.2 Pet Damage Calculation

- [ ] Implement AP coefficient scaling
- [ ] Add Mastery: Master of Beasts calculation
- [ ] Add pet buff multipliers (Bestial Wrath, Frenzy)
- [ ] Implement pet crit/crit damage modifiers

### 2.3 Pet Buff Management

- [ ] Frenzy stack management
- [ ] Beast Cleave duration tracking
- [ ] Bestial Wrath → Piercing Fangs linkage
- [ ] Thrill of the Hunt (pet version)

---

## Phase 3: Core BM Abilities

### 3.1 Kill Command

**Spell IDs:** 34026 (player), 83381 (pet)

- [ ] Player cast triggers pet action
- [ ] Support Animal Companion (second pet)
- [ ] Implement cooldown charge system
- [ ] Add proc triggers:
  - [ ] Dire Command (summon Dire Beast)
  - [ ] Deathblow proc
  - [ ] Kill Command reset (War Orders)

### 3.2 Barbed Shot

**Spell ID:** 217200

- [ ] DoT application with tick scheduling
- [ ] Focus regen buff (up to 8 concurrent)
- [ ] Pet Frenzy stack trigger
- [ ] Bestial Wrath CD reduction (Barbed Wrath)
- [ ] Kill Command reset chance (War Orders)
- [ ] Master Handler (KC CD reduction per tick)

### 3.3 Bestial Wrath

**Spell ID:** 186254

- [ ] Player buff application
- [ ] Pet buff application (all active pets)
- [ ] Scent of Blood (reset Barbed Shot charges)
- [ ] Lead from the Front trigger (Pack Leader)

### 3.4 Cobra Shot

**Spell ID:** 193455

- [ ] Focus cost handling
- [ ] Killer Cobra interaction (reset KC during BW)
- [ ] Serpentine Rhythm/Blessing stacks
- [ ] Barbed Scales (BS CD reduction)

### 3.5 Multi-Shot

**Spell ID:** 2643

- [ ] Beast Cleave buff application (player)
- [ ] Beast Cleave buff application (pets)
- [ ] Duration from talent data

### 3.6 Call of the Wild

**Spell ID:** 359844

- [ ] Spawn stable pets
- [ ] Periodic tick spawning
- [ ] CD reduction for KC/BS
- [ ] Bloody Frenzy Beast Cleave spread

### 3.7 Bloodshed

**Spell ID:** 321530

- [ ] Pet DoT application
- [ ] Dire Beast proc on tick

---

## Phase 4: Talent System

### 4.1 Talent Data Loading

- [ ] Parse talent tree structure
- [ ] Load talent spell effects
- [ ] Track selected talents per character

### 4.2 Core Talent Implementations

**Priority (rotation-affecting):**

- [ ] Killer Cobra
- [ ] Scent of Blood
- [ ] Wild Call
- [ ] Dire Command
- [ ] Barbed Wrath
- [ ] Master Handler
- [ ] Alpha Predator

**Secondary (damage modifiers):**

- [ ] Training Expert
- [ ] Killer Instinct
- [ ] Brutal Companion
- [ ] Piercing Fangs
- [ ] Savagery

### 4.3 Talent Effect Application

- [ ] Implement `applyAffectingAura` pattern
- [ ] Cooldown charge modifications
- [ ] Proc chance calculations
- [ ] Damage multiplier stacking

---

## Phase 5: Hero Talents

### 5.1 Pack Leader

- [ ] Howl of the Pack Leader beast rotation
- [ ] Lead from the Front buff
- [ ] Beast summon system (Wyvern, Boar, Bear)
- [ ] No Mercy damage bonus

### 5.2 Dark Ranger

- [ ] Black Arrow (replaces Kill Shot)
- [ ] Withering Fire integration
- [ ] Phantom Pain spread mechanics

---

## Phase 6: APL Integration

### 6.1 Conditional Expressions

Need APL expression support for:

- [ ] `buff.bestial_wrath.up`
- [ ] `buff.frenzy.stack`
- [ ] `cooldown.kill_command.ready`
- [ ] `cooldown.barbed_shot.charges`
- [ ] `cooldown.barbed_shot.full_recharge_time`
- [ ] `focus.time_to_max`
- [ ] `pet.main.buff.beast_cleave.up`
- [ ] `dot.barbed_shot.remains`

### 6.2 Variable System

- [ ] APL variable support (`variable,name=X,op=set`)
- [ ] Conditional variable evaluation

### 6.3 Action List Calls

- [ ] `call_action_list` implementation
- [ ] Named action lists (cds, st, cleave, etc.)

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests

- [ ] Kill Command damage calculation
- [ ] Barbed Shot Focus regeneration
- [ ] Frenzy stack behavior
- [ ] Cooldown reset mechanics

### 7.2 Integration Tests

- [ ] Full rotation execution
- [ ] Pet action sequencing
- [ ] Buff uptime tracking

### 7.3 SimC Comparison

- [ ] Compare DPS output to SimC
- [ ] Validate buff uptimes
- [ ] Check cooldown usage patterns

---

## Spell ID Reference

| Ability            | Player ID | Pet ID | Buff ID      |
| ------------------ | --------- | ------ | ------------ |
| Kill Command       | 34026     | 83381  | -            |
| Barbed Shot        | 217200    | -      | 246152       |
| Bestial Wrath      | 186254    | -      | 186254       |
| Cobra Shot         | 193455    | -      | -            |
| Multi-Shot         | 2643      | -      | 268877       |
| Call of the Wild   | 359844    | -      | 359844       |
| Bloodshed          | 321530    | 321538 | -            |
| Frenzy             | -         | -      | 272790       |
| Beast Cleave       | -         | -      | 118455 (pet) |
| Thrill of the Hunt | -         | -      | 312365       |
| Piercing Fangs     | -         | -      | 392054       |

---

## Estimated Complexity

| Phase   | Effort | Dependencies |
| ------- | ------ | ------------ |
| Phase 1 | Medium | None         |
| Phase 2 | High   | Phase 1      |
| Phase 3 | High   | Phase 1, 2   |
| Phase 4 | Medium | Phase 3      |
| Phase 5 | Medium | Phase 3, 4   |
| Phase 6 | Medium | Phase 3      |
| Phase 7 | Low    | All          |

**Recommended order:** 1 → 2 → 3 → 4 → 6 → 5 → 7
