# Beast Mastery Hunter Action Priority List

Breakdown of the SimC APL for Beast Mastery Hunter.

## APL Structure

```
Main Actions
    ├── auto_shot (always)
    ├── call_action_list: cds
    ├── call_action_list: trinkets
    └── Conditional Action Lists:
        ├── drst (Dark Ranger Single Target)
        ├── drcleave (Dark Ranger Cleave)
        ├── st (Standard Single Target)
        └── cleave (Standard Cleave)
```

## Precombat Actions

```
actions.precombat=summon_pet
actions.precombat+=/snapshot_stats
actions.precombat+=/variable,name=stronger_trinket_slot,op=setif,value=1,value_else=2,...
```

1. **Summon Pet**: Ensure main pet is active
2. **Snapshot Stats**: Record starting stats
3. **Trinket Variable**: Determine which trinket slot is stronger

## Cooldowns (cds)

```
actions.cds=invoke_external_buff,name=power_infusion,if=buff.call_of_the_wild.up|...
actions.cds+=/berserking,if=buff.call_of_the_wild.up|...
actions.cds+=/blood_fury,if=...
actions.cds+=/ancestral_call,if=...
actions.cds+=/fireblood,if=...
actions.cds+=/potion,if=...
```

### Cooldown Timing Rules

- **With Call of the Wild**: Use during CotW
- **Without CotW**: Use during Bestial Wrath
- **End of Fight**: Use if fight ends soon

## Single Target (st)

```
actions.st=bestial_wrath,if=buff.howl_cooldown.remains-lftf.duration<lftf.duration%gcd*0.5|!tww3_4pc
actions.st+=/barbed_shot,if=full_recharge_time<gcd
actions.st+=/call_of_the_wild
actions.st+=/bloodshed
actions.st+=/kill_command,if=charges_fractional>=cooldown.barbed_shot.charges_fractional&...
actions.st+=/barbed_shot
actions.st+=/cobra_shot
```

### ST Priority Breakdown

1. **Bestial Wrath**
   - Condition: Optimize with Lead From the Front timing
   - Or: If no TWW S3 4pc (simpler)

2. **Barbed Shot (Prevent Cap)**
   - If nearly at 2 charges
   - Don't waste any charge recharge

3. **Call of the Wild**
   - Use on cooldown (major CD)

4. **Bloodshed**
   - Use on cooldown

5. **Kill Command**
   - When charges >= Barbed Shot charges
   - Avoid wasting Lead From the Front windows

6. **Barbed Shot (Dump)**
   - Use remaining charges

7. **Cobra Shot**
   - Filler when nothing else available

## Cleave Actions

```
actions.cleave=bestial_wrath,if=...
actions.cleave+=/barbed_shot,target_if=min:dot.barbed_shot.remains,if=full_recharge<gcd|...
actions.cleave+=/bloodshed
actions.cleave+=/multishot,if=pet.main.buff.beast_cleave.down&(!bloody_frenzy|cotw.cd.remains)
actions.cleave+=/call_of_the_wild
actions.cleave+=/explosive_shot,if=talent.thundering_hooves
actions.cleave+=/kill_command
actions.cleave+=/cobra_shot,if=focus.time_to_max<gcd*2|buff.hogstrider.stack>3|!talent.multishot
```

### Cleave Priority Breakdown

1. **Bestial Wrath** - Same as ST

2. **Barbed Shot**
   - Target with lowest DoT remaining (`target_if=min:dot.barbed_shot.remains`)
   - Conditions: Cap prevention, charge management

3. **Bloodshed**

4. **Multi-Shot**
   - Only if Beast Cleave is down
   - Skip during Bloody Frenzy (CotW provides Beast Cleave)

5. **Call of the Wild**

6. **Explosive Shot** (if Thundering Hooves)
   - Pets charge all targets

7. **Kill Command**

8. **Cobra Shot**
   - If Focus capping OR high Hogstrider stacks

## Dark Ranger Single Target (drst)

```
actions.drst=kill_shot  # Actually Black Arrow
actions.drst+=/bestial_wrath,if=cotw.cd.remains>30|!talent.cotw|ttd<cotw.cd.remains
actions.drst+=/bloodshed
actions.drst+=/call_of_the_wild
actions.drst+=/kill_command,if=withering_fire.tick_time_remains>gcd&<3|wf.down
actions.drst+=/barbed_shot,if=withering_fire.tick_time_remains>0.5&<3|wf.down
actions.drst+=/cobra_shot,if=withering_fire.down
```

### DR ST Priority

1. **Black Arrow** (labeled as kill_shot)
   - Always top priority (execute)

2. **Bestial Wrath**
   - If CotW is far away OR not talented

3. **Bloodshed**

4. **Call of the Wild**

5. **Kill Command**
   - Time around Withering Fire ticks
   - Execute when WF tick is 1-3 GCDs away OR WF down

6. **Barbed Shot**
   - Similar WF tick timing

7. **Cobra Shot**
   - Only when Withering Fire is not active

## Dark Ranger Cleave (drcleave)

```
actions.drcleave=kill_shot
actions.drcleave+=/bestial_wrath,if=cotw.cd.remains>20|!talent.cotw
actions.drcleave+=/barbed_shot,target_if=min:dot.barbed_shot.remains,if=...
actions.drcleave+=/bloodshed
actions.drcleave+=/multishot,if=pet.buff.beast_cleave.down&(!bloody_frenzy|cotw.cd.remains)
actions.drcleave+=/call_of_the_wild
actions.drcleave+=/explosive_shot,if=talent.thundering_hooves
actions.drcleave+=/kill_command,if=withering_fire timing...
actions.drcleave+=/barbed_shot,if=withering_fire timing...
actions.drcleave+=/cobra_shot,if=wf.down&focus.time_to_max<gcd*2
actions.drcleave+=/explosive_shot
```

## Trinket Usage

Complex trinket logic based on:

- Trinket type (use buff vs use damage)
- Call of the Wild timing
- Bestial Wrath timing
- Fight duration
- Special trinket interactions (Netherprism, Araz's Ritual Forge)

### Key Trinket Variables

```
variable,name=quiver_variable  # For Blighted Quiver optimization
variable,name=bw_variable      # For Bestial Wrath alignment
```

## Key APL Expressions

### Target Selection

```
target_if=min:dot.barbed_shot.remains
```

Apply Barbed Shot to target with lowest DoT remaining.

### Charge Management

```
full_recharge_time<gcd
charges_fractional>=cooldown.kill_command.charges_fractional
```

### Buff Timing

```
buff.withering_fire.tick_time_remains>gcd&buff.withering_fire.tick_time_remains<3
```

Execute ability when Withering Fire tick is imminent.

### Lead From the Front Optimization

```
buff.howl_of_the_pack_leader_cooldown.remains-buff.lead_from_the_front.duration<buff.lead_from_the_front.duration%gcd*0.5
```

Align Bestial Wrath with Lead From the Front expiry.

## APL Decision Tree Summary

```
Is Dark Ranger Talented?
├── Yes:
│   ├── AoE (2+ targets with Beast Cleave, 3+ without)?
│   │   ├── Yes → drcleave
│   │   └── No → drst
│   └── Black Arrow is always highest priority
└── No:
    └── AoE (2+ targets with Beast Cleave, 3+ without)?
        ├── Yes → cleave
        └── No → st
```
