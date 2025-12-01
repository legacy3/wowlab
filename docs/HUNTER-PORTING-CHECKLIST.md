# Hunter Porting Checklist

Implementation checklist for Beast Mastery Hunter support in WowLab.

## Current Status Summary

**What Exists:**

- Event-driven simulation framework
- Immutable entity model (Unit, Aura, Spell)
- Effect-TS service architecture
- Basic spell casting system
- Buff/debuff tracking (single instance)

**What's Missing:**

- Pet system (entities, services, mechanics)
- Focus resource management
- Hunter spells and abilities
- Talent implementations
- Multi-instance buff support (Barbed Shot x8)
- Pet damage calculations
- Proc triggers and cooldown resets
- APL conditional logic

---

## Phase 1: Entity Extensions (Foundation)

### Pet Entity

- [ ] Create `Pet` entity extending `Unit`
  - [ ] `ownerId: UnitId` - Reference to hunter
  - [ ] `petType: PetType` - Enum: Main | AnimalCompanion | DireBeast | CallOfTheWild
  - [ ] `apCoefficient: number` - 0.6 for main/companion, 1.0 for Dire Beast
  - [ ] `isTemporary: boolean` - For Dire Beast / CoTW pets
  - [ ] `expiresAt: Timestamp | null` - When temporary pet despawns

### Multi-Instance Buff Support

- [ ] Extend `Aura` or create `BuffSlot` system for Barbed Shot
  - [ ] Support 8 concurrent buff instances
  - [ ] Each instance tracks: `expiresAt`, `tickInterval`, `nextTickAt`
  - [ ] Handle Focus regen per-instance (5 Focus/tick)
  - [ ] Proper expiration and slot reuse

### SpellModifier Extensions

- [ ] Add `onTick(spell, target)` callback for DoT/buff ticks
- [ ] Add `beforeDamage(spell, target, damage)` hook
- [ ] Add `onPetAction(spell, pet, target)` hook
- [ ] Add `onCooldownReset(spell)` for proc tracking
- [ ] Add `onChargeGain(spell)` for charge-based abilities

### Focus Resource

- [ ] Verify `Power` entity supports Focus tracking
- [ ] Base regen: 5 Focus/sec
- [ ] Max: 100 Focus
- [ ] Implement focus cost validation in SpellActions

---

## Phase 2: Pet System (High Complexity)

### PetManager Service

- [ ] Create `PetManagerService`
  - [ ] `spawnPet(ownerId, petType)` - Create and register pet
  - [ ] `despawnPet(petId)` - Remove temporary pets
  - [ ] `getPets(ownerId)` - Get all active pets for a hunter
  - [ ] `getMainPet(ownerId)` - Get primary pet

### Pet Action Execution

- [ ] Implement pet action scheduling
- [ ] Pet GCD handling (separate from player)
- [ ] Pet auto-attack integration

### Pet Damage Calculations

- [ ] AP coefficient application (0.6x or 1.0x)
- [ ] Mastery: Master of Beasts scaling
- [ ] Pet buff multipliers (Frenzy, Beast Cleave, etc.)

### Specific Pet Types

- [ ] Main Pet - Permanent, 60% AP
- [ ] Animal Companion - Permanent, 60% AP (with talent)
- [ ] Dire Beast - Temporary, 100% AP, 8s duration
- [ ] Call of the Wild Pets - Temporary, 60% AP, varies

---

## Phase 3: Core Abilities

### Kill Command (34026/83381)

- [ ] Pet executes attack on target
- [ ] 30 Focus cost
- [ ] 2 charges (with Alpha Predator talent)
- [ ] Animal Companion also attacks (if present)
- [ ] Triggers for Dire Command proc
- [ ] Triggers for Deathblow proc
- [ ] Piercing Fangs interaction during BW

### Barbed Shot (217200)

- [ ] DoT application to target
- [ ] Focus regen buff (246152) on hunter
  - [ ] 8 concurrent buff instances max
  - [ ] 5 Focus per tick
  - [ ] 2s tick interval
  - [ ] 8s duration (20 Focus total per buff)
- [ ] Frenzy application to all pets (stacking to 3)
- [ ] Barbed Wrath CD reduction interaction
- [ ] Master Handler KC CD reduction
- [ ] War Orders KC reset proc
- [ ] Wild Call charge reset handling

### Bestial Wrath (186254)

- [ ] Player buff application (15s duration)
- [ ] 25% damage increase
- [ ] Pet buff application to ALL pets
- [ ] Scent of Blood interaction (Barbed Shot charges)
- [ ] Piercing Fangs linkage (crit damage)
- [ ] Killer Cobra enables KC reset on Cobra Shot

### Cobra Shot (193455)

- [ ] 35 Focus cost validation
- [ ] Basic damage execution
- [ ] Killer Cobra: Reset Kill Command during BW
- [ ] Serpentine Rhythm stack management
- [ ] Venomous Bite buff application

### Multi-Shot (2643)

- [ ] 40 Focus cost validation
- [ ] AoE damage to targets
- [ ] Beast Cleave application to player
- [ ] Beast Cleave application to all pets
- [ ] Beast Cleave duration handling

### Call of the Wild (359844)

- [ ] Summon 2 stable pets
- [ ] Periodic ticks for CD reduction
- [ ] Handles Hati summon (if talented)
- [ ] Pet auto-cast execution
- [ ] Duration tracking and despawn

### Bloodshed (321530/321538)

- [ ] Main pet DoT application
- [ ] 10% per tick Dire Beast summon chance
- [ ] Duration: 18s

### Kill Shot

- [ ] Execute ability (target below 20% HP)
- [ ] Focus refund on kill
- [ ] Black Arrow variant (Dark Ranger hero talent)

---

## Phase 4: Talent System

### High Priority (Rotation-Affecting)

- [ ] **Killer Cobra**: KC reset on Cobra Shot during BW
- [ ] **Scent of Blood**: Barbed Shot charges on BW cast
- [ ] **Wild Call**: BS charge reset on auto crit
- [ ] **Dire Command**: KC chance to summon Dire Beast
- [ ] **Barbed Wrath**: Reduce BW CD per BS cast
- [ ] **Master Handler**: Reduce KC CD per BS tick
- [ ] **Alpha Predator**: +1 KC charge
- [ ] **Savagery**: Kill Command damage + crit
- [ ] **War Orders**: Barbed Shot can reset KC

### Medium Priority (Damage Modifiers)

- [ ] **Training Expert**: Pet damage increase
- [ ] **Killer Instinct**: KC damage to low health targets
- [ ] **Brutal Companion**: Pet bonus attack at max Frenzy
- [ ] **Piercing Fangs**: Crit damage during BW
- [ ] **Thrill of the Hunt**: Crit chance stacks
- [ ] **Bloody Frenzy**: Frenzy during BW
- [ ] **Huntmaster's Call**: Empowered KC damage

### Lower Priority (Utility/Conditional)

- [ ] **Animal Companion**: Second permanent pet
- [ ] **Beast Mastery** (Mastery): Pet damage scaling
- [ ] **Stomp**: AoE on Dire Beast summon
- [ ] **A Murder of Crows**: DoT ability
- [ ] **Venomous Bite**: Serpent Sting on Cobra Shot
- [ ] **Serpentine Rhythm**: Stacking Cobra Shot buff

---

## Phase 5: Hero Talents

### Pack Leader

- [ ] **Howl of the Pack Leader**: Summon Wyvern/Boar/Bear rotation
- [ ] **Lead from the Front**: Empowerment tracking
- [ ] **No Mercy**: KC damage bonus during BW
- [ ] Beast type rotation system
- [ ] Empowerment buff mechanics

### Dark Ranger

- [ ] **Black Arrow**: Replaces Kill Shot
- [ ] **Phantom Pain**: DoT spread mechanic
- [ ] **Withering Fire**: Call of the Wild enhancement
- [ ] Dark Ranger damage scaling

---

## Phase 6: APL Integration

### Conditional Expressions

- [ ] `buff.bestial_wrath.up` / `.down` / `.remains`
- [ ] `buff.frenzy.stack` / `.up` / `.remains`
- [ ] `buff.beast_cleave.up` / `.remains`
- [ ] `buff.barbed_shot.up` / `.stack` (count of active buffs)
- [ ] `buff.thrill_of_the_hunt.stack`
- [ ] `cooldown.kill_command.ready` / `.charges` / `.full_recharge_time`
- [ ] `cooldown.barbed_shot.charges` / `.full_recharge_time`
- [ ] `cooldown.bestial_wrath.ready` / `.remains`
- [ ] `cooldown.call_of_the_wild.ready` / `.remains`
- [ ] `focus` / `focus.deficit` / `focus.time_to_max`
- [ ] `pet.main.buff.beast_cleave.up`
- [ ] `pet.main.buff.frenzy.stack`
- [ ] `talent.killer_cobra.enabled`

### Variable System

- [ ] APL variable declarations
- [ ] Variable updates mid-rotation
- [ ] Action list calls

### Focus Pooling Logic

- [ ] Time-to-max focus calculations
- [ ] Cast time focus regen estimation
- [ ] Optimal focus thresholds

---

## Phase 7: Testing & Validation

### Unit Tests

- [ ] Pet entity creation/despawn
- [ ] Barbed Shot 8-buff slot system
- [ ] Focus regen calculations
- [ ] Frenzy stack management
- [ ] Kill Command pet action
- [ ] Bestial Wrath multi-pet application

### Integration Tests

- [ ] Basic rotation execution
- [ ] Cooldown interactions (Barbed Wrath, Master Handler)
- [ ] Proc triggers (Wild Call, Dire Command)
- [ ] Full APL rotation with conditionals

### SimC Comparison

- [ ] Damage output parity check
- [ ] Buff uptime comparison
- [ ] Resource tracking validation

---

## Implementation Priority Order

Based on dependencies and complexity:

| Order | Phase   | Description       | Effort   | Dependencies |
| ----- | ------- | ----------------- | -------- | ------------ |
| 1     | Phase 1 | Entity Extensions | Medium   | None         |
| 2     | Phase 2 | Pet System        | **HIGH** | Phase 1      |
| 3     | Phase 3 | Core Abilities    | **HIGH** | Phases 1-2   |
| 4     | Phase 4 | Talent System     | Medium   | Phase 3      |
| 5     | Phase 6 | APL Integration   | Medium   | Phase 3      |
| 6     | Phase 5 | Hero Talents      | Medium   | Phases 3-4   |
| 7     | Phase 7 | Testing           | Low      | All          |

---

## Minimum Viable Rotation

To get a **basic working rotation**, you need:

1. Pet Entity (basic version)
2. PetManager Service (spawn main pet only)
3. Kill Command (pet action execution)
4. Barbed Shot (simplified - single buff instance first)
5. Bestial Wrath (player buff only first)
6. Cobra Shot (focus cost)
7. Focus resource tracking

This gets you: BW → BS → KC → Cobra Shot basic loop

---

## Files to Create/Modify

### New Files Needed

```
packages/innocent-domain/src/entities/Pet.ts
packages/innocent-services/src/services/PetManagerService.ts
packages/innocent-services/src/services/FocusService.ts (or extend PowerService)
packages/innocent-spellbook/src/hunter/beast-mastery/*.ts
```

### Files to Modify

```
packages/innocent-domain/src/entities/Unit.ts (pet support)
packages/innocent-domain/src/entities/Aura.ts (multi-instance support)
packages/innocent-domain/src/entities/SpellModifier.ts (new hooks)
packages/innocent-services/src/services/SpellLifecycleService.ts
packages/innocent-rotation/src/context/RotationContext.ts
```

---

## Notes

- **Most Complex Challenge**: 8-concurrent-buff Barbed Shot mechanic (unique to BM)
- **Second Most Complex**: Pet system with multiple pet types and damage scaling
- **Key Architectural Decision**: How to handle multi-instance buffs (extend Aura vs new BuffSlot entity)
- **Reference**: SimC hunter module for validation
