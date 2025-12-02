# Beast Mastery Hunter Buffs

Complete list of player and pet buffs for BM Hunter.

## Player Buffs

### Core Rotational Buffs

#### Barbed Shot (Focus Regen)

- **Spell ID**: 246152
- **Duration**: 8 seconds
- **Effect**: Regenerates Focus over time
- **Stacking**: Multiple instances can exist (one per Barbed Shot cast)
- **Notes**: Tick callback grants Focus each tick

#### Bestial Wrath

- **Spell ID**: 19574
- **Duration**: 15 seconds
- **Effect**: Increases damage dealt
- **Value**: From effect #1 (typically 25%)
- **Notes**:
  - Can be pre-cast before combat
  - Cooldown reducible via Barbed Wrath

#### Beast Cleave (Player)

- **Spell ID**: 268877
- **Duration**: From Beast Cleave talent effect #2
- **Effect**: Enables player cleave damage
- **Trigger**: Multi-Shot cast

#### Call of the Wild

- **Spell ID**: 359844
- **Duration**: 20 seconds
- **Effect**:
  - Summons additional pets periodically
  - Reduces Kill Command and Barbed Shot CDs per tick
- **Notes**: Bloody Frenzy extends Beast Cleave to all pets

### Talent Buffs

#### Thrill of the Hunt

- **Spell ID**: 257946 (trigger)
- **Max Stacks**: From talent effect #2 (typically 3)
- **Effect**: Increases critical strike chance
- **Value**: From effect #1
- **Trigger**: Barbed Shot cast
- **Modified by**: Savagery talent

#### Serpentine Rhythm

- **Spell ID**: 468703
- **Effect**: Damage increase per stack to Cobra Shot
- **Trigger**: Cobra Shot cast
- **Notes**: At max stacks, converts to Serpentine Blessing

#### Serpentine Blessing

- **Spell ID**: 468704
- **Effect**: Damage increase
- **Value**: From effect #1
- **Trigger**: Serpentine Rhythm reaching max stacks

#### Huntmaster's Call

- **Spell ID**: 459731
- **Effect**: Tracks stacks toward Hati/Fenryr summon
- **Trigger**: Dire Beast summon

#### Summon Fenryr

- **Spell ID**: 459735
- **Duration**: Modified by Dire Frenzy
- **Effect**: Haste buff while Fenryr is active
- **Value**: From effect #2

#### Summon Hati

- **Spell ID**: 459738
- **Duration**: Modified by Dire Frenzy
- **Effect**: Damage buff while Hati is active
- **Value**: From effect #2

### Hero Talent Buffs (Pack Leader)

#### Howl of the Pack Leader (Wyvern Ready)

- **Spell ID**: From talent data
- **Effect**: Indicates Wyvern summon is ready
- **Trigger**: Howl of Pack Leader cooldown expires

#### Howl of the Pack Leader (Boar Ready)

- **Spell ID**: From talent data
- **Effect**: Indicates Boar summon is ready

#### Howl of the Pack Leader (Bear Ready)

- **Spell ID**: From talent data
- **Effect**: Indicates Bear summon is ready

#### Howl of the Pack Leader (Cooldown)

- **Spell ID**: From talent data
- **Effect**: ICD between summons
- **Notes**: Modified by Survival Hunter spec aura

#### Wyvern's Cry

- **Spell ID**: From talent data
- **Effect**: Damage increase while Wyvern is active
- **Value**: From effect #1
- **Notes**: Duration extendable via Fury of the Wyvern

#### Hogstrider

- **Spell ID**: 472640
- **Effect**: Increases Cobra Shot damage and targets
- **Value**: From effect #1
- **Trigger**: Boar Charge hits

#### Lead From the Front

- **Spell ID**: 472743
- **Effect**: Damage increase
- **Value**: Different for BM (effect #4) vs other specs
- **Trigger**: Bestial Wrath or Coordinated Assault cast

### Hero Talent Buffs (Dark Ranger)

#### Deathblow

- **Spell ID**: From talent data
- **Effect**: Allows Kill Shot/Black Arrow at any health
- **Notes**:
  - Subject to aura delay
  - Reactable (may_react() in ready check)

#### Withering Fire

- **Spell ID**: From talent data
- **Effect**: Triggers additional Black Arrows
- **Trigger**: Call of the Wild, Trueshot
- **Notes**: Tick callback triggers Deathblow for BM

#### The Bell Tolls

- **Spell ID**: From talent data
- **Effect**: Damage increase
- **Value**: From effect #1
- **Stacking**: Asynchronous
- **Trigger**: Black Arrow cast

#### Blighted Quiver

- **Spell ID**: From tier set data
- **Effect**: Additional Withering Fire arrows
- **Trigger**: Kill Shot during Deathblow

### Tier Set Buffs (TWW S3)

#### Grizzled Fur (Pack Leader 2pc)

- **Spell ID**: 1236564
- **Effect**: Mastery increase

#### Hasted Hooves (Pack Leader 2pc)

- **Spell ID**: 1236565
- **Effect**: Haste increase

#### Sharpened Fangs (Pack Leader 2pc)

- **Spell ID**: 1236566
- **Effect**: Critical Strike increase

## Pet Buffs

### Main Pet & Animal Companion

#### Frenzy

- **Spell ID**: 272790
- **Max Stacks**: 3
- **Effect**: Attack speed increase per stack
- **Value**: From effect #1 (base ~10%)
- **Modified by**:
  - Savagery talent
  - Better Together talent
- **Trigger**: Barbed Shot cast
- **Cache Invalidate**: CACHE_AUTO_ATTACK_SPEED

#### Thrill of the Hunt (Pet)

- **Spell ID**: 312365
- **Max Stacks**: From talent effect #2
- **Effect**: Critical strike chance increase
- **Value**: From effect #1
- **Modified by**: Savagery talent

#### Bestial Wrath (Pet)

- **Spell ID**: 186254
- **Duration**: Matches Hunter's Bestial Wrath
- **Effect**: Damage increase
- **Value**: From effect #1
- **Notes**: Triggers Piercing Fangs on application

#### Piercing Fangs

- **Spell ID**: 392054
- **Effect**: Critical damage multiplier
- **Value**: From effect #1
- **Trigger**: Bestial Wrath buff application
- **Expires**: When Bestial Wrath expires

#### Beast Cleave (Pet)

- **Spell ID**: 118455
- **Duration**: From Beast Cleave talent
- **Effect**: Pet attacks cleave nearby enemies
- **Value**: From Beast Cleave talent effect #1
- **Trigger**: Multi-Shot cast, Bloody Frenzy

### Main Pet Only

#### Solitary Companion

- When no Animal Companion is active
- Damage increase to main pet

#### Bloodseeker

- **Spell ID**: 260249
- **Effect**: Attack speed increase
- **Value**: From effect #1
- **Cache Invalidate**: CACHE_AUTO_ATTACK_SPEED

#### Spearhead (Survival)

- Buff for pet during Spearhead ability

### Dire Beast / Special Pets

#### Dire Beast Bestial Wrath

- **Spell ID**: From Wildspeaker talent data
- **Effect**: Damage increase
- **Trigger**: Wildspeaker talent + BW active when summoned

#### Dire Cleave Beast Cleave

- Duration from Dire Cleave talent effect #2
- Applied on Dire Beast summon

### Call of the Wild Pets

All Call of the Wild pets receive:

- Beast Cleave buff (during Bloody Frenzy)
- Stomp execution (during Bloody Frenzy ticks)
