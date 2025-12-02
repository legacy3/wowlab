# Beast Mastery Hunter Talents

Complete talent breakdown for BM Hunter spec and class trees.

## Class Talents (Shared)

### Row 1
| Talent | Effect |
|--------|--------|
| Kill Shot | Execute ability at 20% health |

### Row 4
| Talent | Effect |
|--------|--------|
| Deathblow | Kill Command has chance to make Kill Shot usable |

### Row 6
| Talent | Effect |
|--------|--------|
| Counter Shot | Interrupt ability |
| Explosive Shot | AoE damage ability |

## Beast Mastery Spec Talents

### Row 1 (Starting)
| Talent | Effect |
|--------|--------|
| Kill Command | Core pet damage ability, 30 Focus, 7.5s CD |

### Row 4
| Talent | Effect |
|--------|--------|
| Barbed Shot | Applies DoT, generates Focus, triggers Frenzy |

### Row 5
| Talent | Effect |
|--------|--------|
| Beast Cleave | Multi-Shot enables pet cleave attacks |

### Row 6
| Talent | Effect |
|--------|--------|
| Dire Beast | Summons temporary beast, Focus generation |
| Cobra Shot | Focus spender, reduces Kill Command CD |

### Row 7
| Talent | Effect |
|--------|--------|
| Bestial Wrath | Major CD - 25% damage increase for Hunter and pets |

### Row 8
| Talent | Effect |
|--------|--------|
| Thrill of the Hunt | Barbed Shot grants crit chance stacks |
| Wild Call | Auto shot crits reset Barbed Shot charge |
| Alpha Predator | +1 Kill Command charge |
| Barbed Wrath | Barbed Shot reduces Bestial Wrath CD |
| Scent of Blood | Bestial Wrath resets Barbed Shot charges |
| Animal Companion | Permanent second pet |

### Row 9
| Talent | Effect |
|--------|--------|
| Savagery | Increases Frenzy and Thrill of Hunt stack value |
| War Orders | Barbed Shot can reset Kill Command |
| Kill Cleave | Kill Command cleaves during Beast Cleave |
| Stomp | Barbed Shot triggers pet Stomp |
| Piercing Fangs | Pet crit damage during Bestial Wrath |
| Dire Frenzy | Dire Beast duration and damage increased |

### Row 10
| Talent | Effect |
|--------|--------|
| Call of the Wild | Major CD - summons stable pets |
| Bloodshed | Pet attack with bleed, summons Dire Beast |
| Brutal Companion | 3 Frenzy stacks trigger bonus pet attack |
| Killer Cobra | Cobra Shot resets KC during Bestial Wrath |

### Row 11 (Capstone)
| Talent | Effect |
|--------|--------|
| Master Handler | Barbed Shot ticks reduce Kill Command CD |
| Dire Command | Kill Command can summon Dire Beast |
| Bloody Frenzy | CotW grants permanent Beast Cleave |

## Key Talent Synergies

### Frenzy Build
```
Barbed Shot → Frenzy Stacks
    ├── Savagery: Higher stack value
    ├── Better Together (Pack Leader): Additional bonus
    └── Brutal Companion: Bonus attack at 3 stacks
```

### Kill Command Build
```
Kill Command
    ├── Alpha Predator: Extra charge
    ├── Killer Cobra: Resets during BW
    ├── War Orders: Barbed Shot resets KC
    ├── Master Handler: DoT ticks reduce CD
    └── Dire Command: Can summon Dire Beast
```

### Beast Cleave Build
```
Multi-Shot → Beast Cleave
    ├── Kill Cleave: KC also cleaves
    ├── Bloody Frenzy: Permanent during CotW
    └── Stomp: Extra AoE on Barbed Shot
```

## Talent Spell Data References

### Kill Command
```cpp
talents.kill_command = find_talent_spell(talent_tree::SPECIALIZATION, "Kill Command");
// Cooldown charges modified by Alpha Predator
cooldown->charges += talents.alpha_predator->effectN(1).base_value();
```

### Barbed Shot
```cpp
talents.barbed_shot = find_talent_spell(talent_tree::SPECIALIZATION, "Barbed Shot");
// Bestial Wrath reduction from Barbed Wrath
bestial_wrath_reduction = talents.barbed_wrath->effectN(1).time_value();
```

### Bestial Wrath
```cpp
talents.bestial_wrath = find_talent_spell(talent_tree::SPECIALIZATION, "Bestial Wrath");
// Scent of Blood charge reset
if (talents.scent_of_blood.ok())
  cooldowns.barbed_shot->reset(true, talents.scent_of_blood->effectN(1).base_value());
```

### Beast Cleave
```cpp
talents.beast_cleave = find_talent_spell(talent_tree::SPECIALIZATION, "Beast Cleave");
// Duration from effect #2
buff_duration = talents.beast_cleave->effectN(2).time_value();
// Damage from effect #1
cleave_damage = talents.beast_cleave->effectN(1).percent();
```

### Cobra Shot
```cpp
talents.cobra_shot = find_talent_spell(talent_tree::SPECIALIZATION, "Cobra Shot");
// Kill Command reduction from effect #3
kill_command_reduction = -timespan_t::from_seconds(data().effectN(3).base_value());
```

### Frenzy-Related
```cpp
// Savagery modifies Frenzy buff
buffs.frenzy->apply_affecting_aura(talents.savagery);

// Thrill of the Hunt max stacks
max_stack = talents.thrill_of_the_hunt->effectN(2).base_value();
```

### Call of the Wild
```cpp
talents.call_of_the_wild = find_talent_spell(talent_tree::SPECIALIZATION, "Call of the Wild");
// Pets spawned from effect #1
pets_spawned = data().effectN(1).base_value();
// CD reduction per tick from effect #3
cd_reduction = talents.call_of_the_wild->effectN(3).base_value() / 100.0;
```

## Talent Selection by Content

### Single Target
- Alpha Predator
- Killer Cobra
- Dire Command
- Master Handler
- War Orders

### Multi-Target / Mythic+
- Beast Cleave
- Kill Cleave
- Bloody Frenzy
- Stomp
- Animal Companion

### Raid / Sustained
- Call of the Wild
- Bloodshed
- Thrill of the Hunt
- Scent of Blood
