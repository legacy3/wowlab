# Beast Mastery – exhaustive SimC mapping (third_party/simc/engine/class_modules/sc_hunter.cpp)

Purpose: per‑spell side effects (buffs, procs, cooldown deltas, pet interactions) needed to re‑implement BM in the wowlab JS simulator. Snapshot: SimC tree as of 2025‑11‑22.

## Buff / debuff inventory (BM‑relevant)

- Player: `barbed_shot_1..n` (focus ticks), `thrill_of_the_hunt` (stacking crit; affected by Savagery), `bestial_wrath` (dmg amp), `call_of_the_wild`, `beast_cleave`, `serpentine_rhythm` → `serpentine_blessing`, `huntmasters_call`, `summon_fenryr`, `summon_hati`, `withering_fire`, `lead_from_the_front`, Pack Leader stat buffs (`grizzled_fur`, `hasted_hooves`, `sharpened_fangs`), `stampede` (PL 4p), `hogstrider`, `wyverns_cry`.
- Pets (main + AC + CotW + dire critters): their own `bestial_wrath`, `beast_cleave`, `frenzy`, `thrill_of_the_hunt`, `stomp`, `potent_mutagen` (TWW S2 4p).
- Target debuffs: `wild_instincts` (from pet KC during CotW), `kill_zone`, `spotters_mark`, `ohnahran_winds` (cross‑spec but affects BM damage multipliers), `sentinel` (hero; cross‑spec).
- Proc objects: `wild_call`, `dire_command`, `snakeskin_quiver`, `wild_instincts`, `bear_without_lftf`, `deathblow`.

## Per‑spell side effects (hunter casts)

**Auto Shot**

- Rolls `Snakeskin Quiver` → fires background, free Cobra Shot.
- On crit, `Wild Call` chance → reset Barbed Shot cooldown, proc counter.
- Rolls `Lock and Load` (MM) even for BM; harmless if buff unused.

**Multi‑Shot (BM version)**

- AoE cap from spell data.
- If Beast Cleave talent and current `beast_cleave` remaining < buff duration: trigger Beast Cleave on hunter + all active pets (main & animal companion).

**Cobra Shot**

- Always reduces Kill Command cooldown by effect3 (negative seconds).
- If `Killer Cobra` and `bestial_wrath` is up → hard reset Kill Command.
- Grants `serpentine_rhythm`; when rhythm at max, expires it and triggers `serpentine_blessing`.
- If `Barbed Scales` → shortens Barbed Shot cooldown by effect1 time.
- Shortens Pack Leader howl cooldown buff via `howl_of_the_pack_leader_cooldown->extend_duration( -effect3 of dire_summons )`.
- Damage & target count include Hogstrider stack value; Hogstrider buff expires after cast.

**Cobra Shot (Snakeskin Quiver background)**

- Background, dual, free focus; uses same base spell; no extra side effects beyond the base Cobra Shot reductions/buffs.

**Barbed Shot**

- Applies/refreshes Barbed Shot regen buffs (focus ticks); tick zero enabled.
- Triggers `thrill_of_the_hunt` on hunter; for each active pet triggers pet `frenzy`, pet `thrill_of_the_hunt`, and `stomp` if talented.
- Reduces Bestial Wrath cooldown by `barbed_wrath` effect time.
- Rolls `War Orders` to fully reset Kill Command cooldown.
- If pet Frenzy reaches `Brutal Companion` stack threshold → pet fires `brutal_companion_ba` bonus hit.
- Impact: if `Poisoned Barbs` roll succeeds → apply Serpent Sting via background `poisoned_barbs` (AoE cleave count from talent effect2).
- DoT tick: if `Master Handler` → reduces Kill Command cooldown per tick.

**Laceration**

- Residual bleed action driven by talent; no extra procs beyond bleed ticks.

**Kill Command (hunter cast)**

- Hunter executes spell; main and AC pets each execute their pet Kill Command; Wildspeaker dire critters also execute.
- Awards Tip of the Spear stacks: base 1 +1 if `consume_howl_of_the_pack_leader` returns true + stacks from `relentless_primal_ferocity` buff when active.
- `Dire Command` chance → casts Dire Beast immediately.
- `Deathblow` chance (BM uses talent effect2) → triggers Deathblow buff.
- `Fury of the Wyvern` talent → extends `wyverns_cry` by effect2, capped at effect4 total.
- Shortens Howl of the Pack Leader cooldown buff via `dire_summons` (BM uses effect1).

**Dire Beast**

- Spawns dire beast for duration/attack count from helper; no direct damage.
- `Huntmaster’s Call` stacking: on each cast, increment; at cap, 50/50 summon Fenryr (haste buff + pet) or Hati (damage buff + pet); resets stacks.

**Bestial Wrath**

- Applies BW buff to hunter + all active pets + dire critters (Wildspeaker).
- If `Scent of Blood` → resets Barbed Shot charges by effect1.
- If `Lead From the Front` → triggers buff and Howl of the Pack Leader.
- If TWW S2 BM 2p equipped and Barbed Shot talented → fires empowered Barbed Shot background.
- If TWW S2 BM 4p equipped → applies `potent_mutagen` buff to main pet.

**Call of the Wild**

- Triggers CotW buff; spawns CotW stable pet(s) for duration (effect2) and count (effect1).
- Up‑front CD reduction: Kill Command & Barbed Shot shortened by percent = effect3 * effect1.
- Each buff tick: spawns additional CotW pet for effect2 duration; again reduces KC/Barbed Shot by same percent; with `Bloody Frenzy` → reapplies Beast Cleave to hunter/pets/CotW pets and triggers `stomp` on each pet.
- Applies `withering_fire` buff for full CotW duration.

**Bloodshed**

- No direct damage; orders each active main/AC pet to cast their Bloodshed on the target. Ready/target checks enforced via pet action readiness.

**A Murder of Crows**

- Dual/background DoT; each tick fires `peck` ranged attack; focus cost forced to 0 regardless of spell data.

**Stampede (Pack Leader 4p)**

- Ground AoE: each dot tick triggers three staggered damage missiles (0.6s/0.9s/1.2s travel); aoe target cap from set bonus effect3.

## Pet action side effects (Kill Command and related)

- Pet Kill Command (BM): background/proc. If `Kill Cleave` talent and Beast Cleave buff up with >1 enemy → replicates % of damage to extra targets (ignores target multipliers on replicas).
- If main pet, `Wild Instincts` talent, and hunter has Call of the Wild buff → applies `wild_instincts` debuff to target (damage multiplier hook).
- If `Phantom Pain` talent (Dark Ranger) → replicates % of damage to up to N targets with Black Arrow ticking.

## Hero talent: Pack Leader (BM‑relevant)

- Howl ready buffs: wyvern/boar/bear. When ready buff ends and no cooldown buff, start `howl_of_the_pack_leader_cooldown`; when cooldown expires, auto‑trigger next howl (state machine `howl_of_the_pack_leader_next_beast`).
- Boar Charge action: impact + cleave both roll Hogstrider Mongoose Fury chance (from Hogstrider) → can trigger `mongoose_fury` (SV) and always increment Hogstrider stacks.
- Hogstrider buff: stacking; increases Cobra Shot damage and target count; consumed/expired after Cobra Shot.
- Wyvern’s Cry buff: applied by wyvern howl; extended by Kill Command (Pack Leader `Fury of the Wyvern`) and by Wildfire Bomb (SV path) up to cap.
- Lead From the Front: triggered by Bestial Wrath; flat damage bonus (BM uses effect = 4%) and triggers howl.
- Dire Summons: shortens howl cooldown when Kill Command or Cobra Shot cast (negative extension to cooldown buff).
- Pack Leader tier set (TWW S3): rotating stat buffs (`grizzled_fur`, `hasted_hooves`, `sharpened_fangs`) from 2p; `stampede` ground AoE + buff from 4p.

## Tier sets (BM)

- TWW S1 BM: `harmonize` buff (2p/4p) exists; pull values from spell data.
- TWW S2 BM: 2p Jackpot callback casts empowered Barbed Shot on proc; 4p applies `potent_mutagen` to main pet on Bestial Wrath.
- TWW S3 Pack Leader: see hero section.

## Multiplier / regen hooks

- `affected_by` flags: `master_of_beasts` (mastery), `bestial_wrath`, `thrill_of_the_hunt`, Pack Leader (`wyverns_cry`, `lead_from_the_front`), Dark Ranger (`the_bell_tolls`), tier set multipliers. Apply to hunter and pet actions in composite multipliers.
- Focus regen base 5/s, scaled by Pack Tactics and spec passives; caches for haste and attack haste enabled.
- Base GCD 1.5s (ranged).

## Cooldown & resource coupling (must mirror order)

- Cobra Shot: KC −effect3; `Killer Cobra` resets KC if BW up; Barbed Scales −Barbed Shot; Dire Summons shortens howl CD; consumes Hogstrider.
- Barbed Shot: BW −barbed_wrath; War Orders resets KC; Master Handler tick −KC; Poisoned Barbs serpent sting proc; Frenzy/Brutal Companion handling; TWW S2 proc; tick zero.
- Auto Shot crit: Wild Call reset Barbed Shot.
- Bestial Wrath: Scent of Blood resets Barbed Shot charges; TWW S2 hooks; Lead From the Front triggers howl.
- Call of the Wild: upfront + per‑tick % reduction to KC/Barbed Shot; Bloody Frenzy reapplies Beast Cleave + Stomp; pet spawn per tick.
- Kill Command: Dire Command proc → Dire Beast; Fury of the Wyvern extends Wyvern’s Cry; consumes Howl for extra Tip stack; Deathblow chance; Dire Summons shortens howl CD.

## Implementation checklist

- Distinct buff instances for hunter vs each pet; honor SimC ordering (hunter action executes, then pet loops).
- Preserve stack caps/refresh behavior: Barbed Shot regen, Thrill max, Frenzy stacks + Brutal Companion trigger, Hogstrider increment/consume.
- Place proc rolls where SimC does: execute vs impact vs tick (see above bullets).
- Apply cooldown adjustments as additive time deltas (not recharge multipliers).
- Call of the Wild tick handler must spawn pets and, with Bloody Frenzy, reapply Beast Cleave + Stomp.
- Implement Pack Leader howl scheduler + consumption in Kill Command; include Hogstrider and Wyvern’s Cry extension logic; cooldown shortening via Dire Summons.
- Gate Kill Command readiness on pet target range (`pet kill_command target_ready`) same as SimC.

Numeric values: read directly from spell data (dbc) at runtime or embed constants; SimC uses dbc lookups.

## Spell & Buff IDs (from SimC source)

### Hunter Spells (core BM abilities)

- **Cobra Shot**: 193455 (base data)
- **Barbed Shot**: 246152 (regen buff)
- **Kill Command (BM player)**: talent-based lookup
- **Kill Command (BM pet)**: 83381
- **Bestial Wrath**: 186254 (player buff)
- **Multi-Shot**: 2643 (AoE data)
- **Call of the Wild**: talent-based lookup
- **Dire Beast**: 219199 (summon spell)
- **Bloodshed**: 321538 (DoT)
- **Laceration**: 459555 (driver), 459560 (bleed)
- **A Murder of Crows**: 131894 (DoT), 131900 (peck damage)

### Hunter Buffs (BM-specific)

- **Bestial Wrath**: 186254
- **Thrill of the Hunt**: 312365
- **Beast Cleave**: 268877 (hunter), 118455 (pet buff base), 118459 (pet damage)
- **Serpentine Rhythm**: 468703
- **Serpentine Blessing**: 468704
- **Huntmaster's Call**: 459731
- **Summon Fenryr**: 459735
- **Summon Hati**: 459738
- **Withering Fire**: 466991 (buff), 468037 (black arrow variant)
- **Deathblow**: 378770 (buff)

### Pet Buffs

- **Frenzy**: 272790
- **Thrill of the Hunt** (pet): 312365
- **Bestial Wrath** (pet): 186254 (main pet), 344572 (pet damage spell)
- **Beast Cleave** (pet): 118455
- **Potent Mutagen** (TWW S2 4p): 1218003 (buff), 1218004 (damage)
- **Solitary Companion**: 474751
- **Piercing Fangs**: 392054

### Target Debuffs

- **Wild Instincts**: 424567
- **Kill Zone**: 393480
- **Spotter's Mark**: 466872
- **Ohnahran Winds**: 1215057
- **Sentinel**: 450387 (debuff), 450412 (tick)

### Proc/Background Actions

- **Snakeskin Quiver**: talent-based (fires Cobra Shot 193455)
- **Stomp** (primary): 1217528
- **Stomp** (cleave): 201754
- **Poisoned Barbs**: 1217549
- **Brutal Companion**: talent-based (effectN 1 = stack threshold, effectN 2 = damage bonus)
- **Kill Cleave**: 389448
- **Wild Hunt**: 62762 (energize)
- **Ravenous Leap** (Fenryr): 459753

### Pack Leader (Hero Talent)

- **Howl of the Pack Leader** (Wyvern ready): 471878
- **Howl of the Pack Leader** (Boar ready): 472324
- **Howl of the Pack Leader** (Bear ready): 472325
- **Howl of the Pack Leader** (cooldown): 471877
- **Wyvern's Cry** (buff): 471881, 1222271 (summon)
- **Boar Charge** (trigger): 472020
- **Boar Charge** (impact): 471936
- **Boar Charge** (cleave): 471938
- **Bear Summon**: 471993
- **Bear Buff**: 1225858
- **Bear Bleed**: 471999
- **Hogstrider** (buff): 472640
- **Lead From the Front** (buff): 472743
- **Ursine Fury** (chance): 472478
- **Envenomed Fangs**: 472525
- **Fury of the Wyvern** (proc): 472552

### Pack Leader Tier Set (TWW S3)

- **Grizzled Fur** (2p mastery): 1236564
- **Hasted Hooves** (2p haste): 1236565
- **Sharpened Fangs** (2p crit): 1236566
- **Stampede** (4p buff): 1250068
- **Stampede** (4p damage): 201594

### Other Tier Sets

- **TWW S2 BM 2p**: talent-based (Jackpot → empowered Barbed Shot)
- **TWW S2 BM 4p**: 1218003 (Potent Mutagen buff), 1218004 (damage)
- **TWW S1 BM**: 457072 (Harmonize buff)

### Wildspeaker (Dire Critter)

- **Wildspeaker Bestial Wrath**: 1235388
- **Wildspeaker Kill Command**: 1232922

### Cross-Spec / Shared

- **Hunter** (spec passive): 137014
- **Critical Strikes**: 157443
- **Auto Shot**: 75
- **Steady Shot Energize**: 77443
- **Call Pet**: 883
- **Serpent Sting**: 271788 (BM), 259491 (SV), 13810 (base debuff duration)

### Dark Ranger Hero (cross-spec)

- **Black Arrow**: 466930 (spell), 468572 (DoT)
- **The Bell Tolls**: 1232992 (buff)
- **Phantom Pain**: 468019
- **Bleak Arrows**: 467718
- **Shadow Hounds**: 442419 (summon)
- **Bleak Powder**: 467914 (MM), 472084 (SV)
- **TWW S3 Dark Ranger 4pc**: 1236975

### Survival (for reference)

- **Kill Command (SV player)**: talent-based
- **Kill Command (SV pet)**: 259277
- **Tip of the Spear**: 260286 (buff), 460852 (explosive buff), 471536 (FotE buff)
- **Mongoose Fury**: 259388
- **Wildfire Bomb**: 259495 (data), 265157 (damage), 269747 (DoT)

### Constants & Magic Numbers

- **BARBED_SHOT_BUFFS_MAX**: 8 (max simultaneous Barbed Shot regen buffs)
