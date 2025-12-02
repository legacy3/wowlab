# Beast Mastery Hunter Documentation

Comprehensive documentation of Beast Mastery Hunter mechanics extracted from SimulationCraft (simc).

## Documentation Structure

- [Overview](./overview.md) - High-level spec overview and core mechanics
- [Spells](./spells.md) - All BM spells with IDs, costs, and mechanics
- [Buffs](./buffs.md) - Player and pet buffs
- [Debuffs](./debuffs.md) - Target debuffs
- [Procs](./procs.md) - Proc mechanics and triggers
- [Pets](./pets.md) - Pet mechanics and abilities
- [Talents](./talents.md) - Talent tree breakdown
- [Hero Talents](./hero-talents.md) - Pack Leader and Dark Ranger hero specs
- [APL](./apl.md) - Action Priority List breakdown
- [Tier Sets](./tier-sets.md) - Season tier set bonuses

## Quick Reference

### Core Rotation Priority (Single Target)

1. **Kill Shot/Black Arrow** (execute phase, <20% or Deathblow)
2. **Bestial Wrath** (delayed for Howl of Pack Leader timing with TWW3 4pc)
3. **Barbed Shot** (prevent cap, maintain Frenzy)
4. **Call of the Wild** (major CD)
5. **Bloodshed**
6. **Kill Command** (when charges >= Barbed Shot charges)
7. **Barbed Shot** (dump charges)
8. **Cobra Shot** (filler, gated by Focus cap or Hogstrider stacks)

### Key Resources

- **Focus**: Primary resource (100 base, 5/sec regen)
- **Pet Frenzy Stacks**: Up to 3 stacks from Barbed Shot
- **Barbed Shot Charges**: 2 base charges (3 with Alpha Predator)

### Critical Proc Mechanics

- **Wild Call**: Auto Shot crits reset Barbed Shot charge
- **Dire Command**: Kill Command can spawn Dire Beast
- **Scent of Blood**: Bestial Wrath resets Barbed Shot charges
- **Killer Cobra**: Cobra Shot resets KC during Bestial Wrath

### Spec Identity

Beast Mastery is a ranged spec that deals damage primarily through pets. The spec revolves around:

- Maintaining Frenzy stacks on pets via Barbed Shot
- Synchronizing cooldowns (Bestial Wrath, Call of the Wild)
- Maximizing Kill Command usage
- Managing Barbed Shot charge flow (Wild Call, Scent of Blood)
- Execute phase with Kill Shot/Black Arrow

### Hero Talent Key Interactions

**Pack Leader:**

- Kill Command consumes Howl buff to summon beasts
- Bestial Wrath waits for Howl cooldown to align with Lead From the Front
- Dire Beast summons feed Huntmaster's Call stacks (leads to Hati/Fenryr)

**Dark Ranger:**

- Black Arrow replaces Kill Shot (usable <10% OR >80% OR with Deathblow)
- Withering Fire windows dictate Kill Command/Barbed Shot timing
- Must execute abilities when Withering Fire tick is 0.5-3 GCDs away
