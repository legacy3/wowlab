# Spell & Item Detail Views Design Document

This document outlines the design for simulation-focused detail views for Spells and Items in WowLab Portal.

## Data Sources Analysis

Based on analysis of `third_party/wowlab-data/data/tables/`, we have access to **1,081 CSV tables** from the WoW client database. The following tables are most relevant for simulation purposes.

---

## Part 1: Spell Detail View

### Currently Available in SpellDataFlat Schema

The existing schema (`packages/wowlab-core/src/internal/schemas/Spell.ts`) already includes:

| Category              | Fields                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Core**              | `id`, `name`, `description`, `auraDescription`, `descriptionVariables`, `fileName`, `isPassive`, `knowledgeSource` |
| **Timing**            | `castTime`, `recoveryTime`, `startRecoveryTime`                                                                    |
| **Resources**         | `manaCost`, `powerCost`, `powerCostPct`, `powerType`                                                               |
| **Charges**           | `maxCharges`, `chargeRecoveryTime`                                                                                 |
| **Range**             | `rangeMin0/1`, `rangeMax0/1`                                                                                       |
| **Geometry**          | `coneDegrees`, `radiusMin`, `radiusMax`                                                                            |
| **Damage/Defense**    | `schoolMask`, `defenseType`                                                                                        |
| **Scaling**           | `bonusCoefficientFromAP`, `effectBonusCoefficient`                                                                 |
| **Interrupts**        | `interruptFlags`, `interruptAura0/1`, `interruptChannel0/1`                                                        |
| **Duration**          | `duration`, `maxDuration`                                                                                          |
| **Empower**           | `canEmpower`, `empowerStages`                                                                                      |
| **Mechanics**         | `dispelType`, `facingCasterFlags`, `speed`, `spellClassSet`, `spellClassMask1-4`                                   |
| **Levels**            | `baseLevel`, `spellLevel`, `maxLevel`, `maxPassiveAuraLevel`                                                       |
| **Aura Restrictions** | `casterAuraState/Spell`, `targetAuraState/Spell`, `excludeCaster/TargetAuraState/Spell`                            |
| **Shapeshift**        | `shapeshiftMask0/1`, `shapeshiftExclude0/1`, `stanceBarOrder`                                                      |
| **Totems**            | `totem0/1`, `requiredTotemCategory0/1`                                                                             |
| **Arrays**            | `attributes[]`, `effectTriggerSpell[]`, `implicitTarget[]`, `learnSpells[]`                                        |

### Additional Data Available from CSV Tables

#### SpellEffect.csv (Critical for Simulations)

```
ID, EffectAura, DifficultyID, EffectIndex, Effect, EffectAmplitude, EffectAttributes,
EffectAuraPeriod, EffectBonusCoefficient, EffectChainAmplitude, EffectChainTargets,
EffectItemType, EffectMechanic, EffectPointsPerResource, EffectPos_facing,
EffectRealPointsPerLevel, EffectTriggerSpell, BonusCoefficientFromAP, PvpMultiplier,
Coefficient, Variance, ResourceCoefficient, GroupSizeBasePointsCoefficient,
EffectBasePointsF, ScalingClass, EffectMiscValue_0/1, EffectRadiusIndex_0/1,
EffectSpellClassMask_0-3, ImplicitTarget_0/1, SpellID
```

#### SpellAuraOptions.csv

```
ID, DifficultyID, CumulativeAura, ProcCategoryRecovery, ProcChance, ProcCharges,
SpellProcsPerMinuteID, ProcTypeMask_0/1, SpellID
```

#### SpellProcsPerMinute.csv + SpellProcsPerMinuteMod.csv

```
// Base RPPM
ID, BaseProcRate, Flags

// Modifiers (haste, crit, spec-specific)
ID, Type, Param, Coeff, SpellProcsPerMinuteID
```

#### SpellCooldowns.csv

```
ID, DifficultyID, CategoryRecoveryTime, RecoveryTime, StartRecoveryTime, AuraSpellID, SpellID
```

#### SpellCategories.csv

```
ID, DifficultyID, Category, DefenseType, DiminishType, DispelType, Mechanic,
PreventionType, StartRecoveryCategory, ChargeCategory, SpellID
```

#### SpellDiminish.csv (PvP/DR mechanics)

```
ID, Name_lang, Duration, Multiplier, ImmunityStacks, MaxStacks
```

#### SpellLabel.csv (For targeting spell modifications)

```
ID, LabelID, SpellID
```

#### SpellScaling.csv

```
ID, SpellID, MinScalingLevel, MaxScalingLevel
```

#### SpellItemEnchantment.csv

```
ID, Name_lang, Duration, EffectArg_0-2, Flags, EffectScalingPoints_0-2,
IconFileDataID, ItemLevelMin, ItemLevelMax, EffectPointsMin_0-2, ItemVisual,
RequiredSkillID, RequiredSkillRank, ItemLevel, Charges, Effect_0-2,
ScalingClass, ScalingClassRestricted, MinLevel, MaxLevel
```

#### SpellReplacement.csv

```
ID, ReplacementSpellID, SpellID
```

---

## Mocked Spell Detail View

### `/spell/[id]` - Example: Aimed Shot (19434)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Icon] AIMED SHOT                                              Spell #19434 │
│ ─────────────────────────────────────────────────────────────────────────── │
│ A powerful aimed shot that deals 248% of Attack Power as Physical damage.  │
│                                                                             │
│ ┌─ QUICK STATS ──────────────────────────────────────────────────────────┐ │
│ │ Cast Time: 2.5s            │ Cooldown: 12s           │ Range: 40 yds   │ │
│ │ Resource: 35 Focus         │ Charges: -              │ GCD: 1.5s       │ │
│ │ School: Physical           │ Dispel Type: -          │ Mechanic: -     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ SPELL EFFECTS ─────────────────────────────────────────────────────────────┐
│                                                                              │
│ Effect #0: SCHOOL_DAMAGE (2)                                                 │
│ ├─ Base Points: 0                                                            │
│ ├─ Coefficient: 2.48 (SP) / 0.0 (AP)                                         │
│ ├─ Variance: 0.05                                                            │
│ ├─ PvP Multiplier: 1.0                                                       │
│ ├─ Chain Targets: 0                                                          │
│ ├─ Radius: 0 yds (min) / 0 yds (max)                                         │
│ ├─ Target: TARGET_UNIT_TARGET_ENEMY (6)                                      │
│ └─ Trigger Spell: -                                                          │
│                                                                              │
│ Effect #1: APPLY_AURA (6) - PERIODIC_DAMAGE (3)                              │
│ ├─ Base Points: 0                                                            │
│ ├─ Coefficient: 0.62 (SP)                                                    │
│ ├─ Aura Period: 2000ms                                                       │
│ ├─ Duration: 6000ms                                                          │
│ └─ Target: TARGET_UNIT_TARGET_ENEMY (6)                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ PROC MECHANICS ────────────────────────────────────────────────────────────┐
│                                                                              │
│ [No proc behavior - this is a directly cast spell]                           │
│                                                                              │
│ TRIGGERS SPELLS:                                                             │
│ └─ #378888 Trick Shots (on Trick Shots active)                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SCALING & DIFFICULTY ──────────────────────────────────────────────────────┐
│                                                                              │
│ Scaling Class: Hunter (-7)                                                   │
│ Min Scaling Level: 1                                                         │
│ Max Scaling Level: 80                                                        │
│                                                                              │
│ ┌─ DIFFICULTY OVERRIDES ───────────────────────────────────────────────────┐ │
│ │ Normal (1):     Base values                                              │ │
│ │ Heroic (2):     -                                                        │ │
│ │ Mythic (16):    -                                                        │ │
│ │ Mythic+ (8):    PvP Multiplier: 0.85                                     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SPELL ATTRIBUTES (FLAGS) ──────────────────────────────────────────────────┐
│                                                                              │
│ Attributes[0]: 0x00000000                                                    │
│ ├─ [_] ATTR0_UNK0                                                            │
│ ├─ [_] ATTR0_REQ_AMMO                                                        │
│ └─ [_] ATTR0_ON_NEXT_SWING                                                   │
│                                                                              │
│ Attributes[1]: 0x00400000                                                    │
│ ├─ [x] ATTR1_CHANNEL_TRACK_TARGET                                            │
│ └─ ...                                                                       │
│                                                                              │
│ [Expand all 16 attribute flags...]                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SPELL CLASS OPTIONS ───────────────────────────────────────────────────────┐
│                                                                              │
│ Spell Class Set: 9 (Hunter)                                                  │
│ Spell Class Mask: [0x00000001, 0x00000000, 0x00000000, 0x00000000]            │
│                                                                              │
│ This mask is used by talents and other spells to modify this ability:        │
│ ├─ Careful Aim (#260228) - +50% crit when target >70% HP                     │
│ ├─ Trick Shots (#257621) - Ricochet to nearby enemies                        │
│ └─ Serpentstalker's Trickery (#378888) - 30% proc for aimed shot             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ AURA RESTRICTIONS ─────────────────────────────────────────────────────────┐
│                                                                              │
│ Caster Must Have:                                                            │
│ └─ (none)                                                                    │
│                                                                              │
│ Caster Must NOT Have:                                                        │
│ └─ (none)                                                                    │
│                                                                              │
│ Target Must Have:                                                            │
│ └─ (none)                                                                    │
│                                                                              │
│ Target Must NOT Have:                                                        │
│ └─ (none)                                                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SHAPESHIFT REQUIREMENTS ───────────────────────────────────────────────────┐
│                                                                              │
│ Required Forms: None (usable in any form)                                    │
│ Excluded Forms: None                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SPELL LABELS ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ Label IDs: [17, 235, 1024]                                                   │
│ ├─ 17: Shot                                                                  │
│ ├─ 235: Marksmanship                                                         │
│ └─ 1024: Focus Spender                                                       │
│                                                                              │
│ Labels are used by talents/effects to target groups of spells.               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ RELATED SPELLS ────────────────────────────────────────────────────────────┐
│                                                                              │
│ REPLACES: -                                                                  │
│ REPLACED BY: -                                                               │
│                                                                              │
│ LEARNS ON CAST:                                                              │
│ └─ (none)                                                                    │
│                                                                              │
│ TRIGGERED BY THIS SPELL:                                                     │
│ ├─ #378888 Trick Shots Damage                                                │
│ └─ #389879 Careful Aim Buff                                                  │
│                                                                              │
│ TRIGGERS THIS SPELL:                                                         │
│ └─ #19434 is directly cast (not triggered)                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ EMPOWER DATA ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ [Not an empowered spell]                                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ RAW DATA INSPECTOR ────────────────────────────────────────────────────────┐
│                                                                              │
│ [Collapsible sections for raw CSV data]                                      │
│                                                                              │
│ ▶ Spell.csv row                                                              │
│ ▶ SpellMisc.csv row                                                          │
│ ▶ SpellEffect.csv rows (3)                                                   │
│ ▶ SpellAuraOptions.csv row                                                   │
│ ▶ SpellCategories.csv row                                                    │
│ ▶ SpellCooldowns.csv row                                                     │
│ ▶ SpellLevels.csv row                                                        │
│ ▶ SpellPower.csv rows (1)                                                    │
│ ▶ SpellLabel.csv rows (3)                                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SIMULATION NOTES ──────────────────────────────────────────────────────────┐
│                                                                              │
│ Key simulation values:                                                       │
│ ├─ Base damage coefficient: 2.48 * Attack Power                              │
│ ├─ DoT coefficient: 0.62 * Attack Power over 6s (3 ticks)                    │
│ ├─ Cast time affected by haste: Yes                                          │
│ ├─ GCD affected by haste: Yes                                                │
│ ├─ Cooldown affected by haste: No                                            │
│ └─ Can crit: Yes                                                             │
│                                                                              │
│ Notes:                                                                       │
│ - Careful Aim talent increases crit by 50% when target HP > 70%              │
│ - Trick Shots talent causes ricochet damage to nearby targets                │
│ - Lock and Load talent can make this instant cast                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Item Detail View

### Currently Available in ItemDataFlat Schema

The existing schema (`packages/wowlab-core/src/internal/schemas/Item.ts`) includes:

| Category           | Fields                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| **Core**           | `id`, `name`, `description`, `fileName`                                 |
| **Classification** | `classId`, `subclassId`, `inventoryType`, `quality`                     |
| **Stats**          | `itemLevel`, `stats[]` (type, value), `speed`                           |
| **Requirements**   | `requiredLevel`                                                         |
| **Economy**        | `buyPrice`, `sellPrice`, `stackable`, `maxCount`, `binding`             |
| **Effects**        | `effects[]` (spellId, triggerType, charges, cooldown, categoryCooldown) |

### Additional Data Available from CSV Tables

#### ItemSparse.csv (Primary item data)

```
ID, AllowableRace, Description_lang, Display_lang, ExpansionID, DmgVariance,
LimitCategory, DurationInInventory, QualityModifier, BagFamily, StartQuestID,
StatPercentageOfSocket_0-9, StatPercentEditor_0-9, StatModifier_bonusStat_0-9,
Stackable, MaxCount, MinReputation, RequiredAbility, SellPrice, BuyPrice,
VendorStackCount, PriceVariance, Flags_0-4, OppositeFactionItemID,
ContentTuningID, PlayerLevelToItemLevelCurveID, ItemNameDescriptionID,
RequiredTransmogHoliday, RequiredHoliday, Gem_properties, Socket_match_enchantment_ID,
TotemCategoryID, InstanceBound, ZoneBound_0/1, ItemSet, LockID, PageID,
ItemDelay, MinFactionID, RequiredSkillRank, RequiredSkill, ItemLevel,
AllowableClass, ArtifactID, SpellWeight, SpellWeightCategory,
SocketType_0-2, SheatheType, Material, Bonding, DamageType,
ContainerSlots, RequiredPVPMedal, RequiredPVPRank, OverallQualityID
```

#### ItemBonus.csv (Bonus ID system - CRITICAL for M+/Raid gear)

```
ID, Value_0-3, ParentItemBonusListID, Type, OrderIndex

Type values:
1  = Item Level delta
2  = Stat allocation
3  = Quality override
4  = Name suffix
5  = Name prefix
6  = Socket
7  = Appearance modification
11 = Scaling curve
13 = Required level override
14 = Secondary stat allocation
23 = Tertiary stat
38 = Crafting quality tier
```

#### ItemBonusList.csv

```
ID, Flags
```

#### ItemBonusTreeNode.csv (How bonus IDs are selected)

```
ID, ItemContext, ChildItemBonusTreeID, ChildItemBonusListID,
ChildItemLevelSelectorID, ChildItemBonusListGroupID, IblGroupPointsModSetID,
MinMythicPlusLevel, MaxMythicPlusLevel, ItemCreationContextGroupID,
Flags, ParentItemBonusTreeID
```

#### ItemBonusListLevelDelta.csv

```
ItemLevelDelta, ID
```

#### ItemEffect.csv

```
ID, LegacySlotIndex, TriggerType, Charges, CoolDownMSec, CategoryCoolDownMSec,
SpellCategoryID, SpellID, ChrSpecializationID, PlayerConditionID
```

#### ItemSet.csv + ItemSetSpell.csv

```
// Set definition
ID, Name_lang, SetFlags, RequiredSkill, RequiredSkillRank, ItemID_0-16

// Set bonuses
ID, ChrSpecID, SpellID, TraitSubTreeID, Threshold, ItemSetID
```

#### ItemClass.csv + ItemSubClass.csv

```
// Class
ID, ClassName_lang, ClassID, PriceModifier, Flags

// Subclass
DisplayName_lang, VerboseName_lang, ID, ClassID, SubClassID,
AuctionHouseSortOrder, PrerequisiteProficiency, Flags, DisplayFlags,
WeaponSwingSize, PostrequisiteProficiency
```

#### GemProperties.csv

```
ID, Enchant_ID, Type
```

#### SpellItemEnchantment.csv (For gems and enchants)

```
ID, Name_lang, Duration, EffectArg_0-2, Flags, EffectScalingPoints_0-2,
EffectPointsMin_0-2, ItemVisual, Effect_0-2, ScalingClass, ItemLevel,
MinLevel, MaxLevel
```

#### ItemDamageOneHand.csv / ItemDamageTwoHand.csv

```
ID, ItemLevel, Quality_0-6
```

#### ItemArmorQuality.csv / ItemArmorTotal.csv

```
ID, Qualitymod_0-6
ID, ItemLevel, Cloth, Leather, Mail, Plate
```

#### RandPropPoints.csv (Secondary stat allocation)

```
ID, DamageReplaceStatF, DamageSecondaryF, EpicF_0-4, SuperiorF_0-4, GoodF_0-4, ...
```

#### ExpectedStat.csv (Expected stats per level)

```
ID, ExpansionID, CreatureHealth, PlayerHealth, CreatureAutoAttackDps,
CreatureArmor, PlayerMana, PlayerPrimaryStat, PlayerSecondaryStat,
ArmorConstant, CreatureSpellDamage, ContentSetID, Lvl
```

#### CurvePoint.csv (For scaling curves)

```
Pos_0, Pos_1, PosPreSquish_0, PosPreSquish_1, ID, CurveID, OrderIndex
```

#### ItemBonusSeason.csv + ItemBonusSeasonUpgradeCost.csv

```
// Season
ID, SeasonID

// Upgrade costs
SourceText_lang, ID, CostItemID, CurrencyID, OrderIndex, ItemBonusSeasonID,
FragmentItemID, FragmentsEarnedTrackingCurrencyID
```

---

## Mocked Item Detail View

### `/item/[id]` - Example: Algari Competitor's Cloth Vest (211980)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Icon] ALGARI COMPETITOR'S CLOTH VEST                         Item #211980  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Item Level 593                                                 Epic Quality │
│ Binds when picked up                                                        │
│ Chest                                                            Cloth Armor│
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ 3,847 Armor                                                                 │
│                                                                             │
│ +2,156 Intellect                                                            │
│ +3,234 Stamina                                                              │
│ +847 Critical Strike                                                        │
│ +635 Mastery                                                                │
│                                                                             │
│ [Prismatic Socket]                                                          │
│                                                                             │
│ Requires Level 80                                                           │
│ "Forged in the fires of competition."                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─ ITEM CLASSIFICATION ───────────────────────────────────────────────────────┐
│                                                                              │
│ Class: Armor (4)                                                             │
│ Subclass: Cloth (1)                                                          │
│ Inventory Type: Chest (5)                                                    │
│ Quality: Epic (4)                                                            │
│ Expansion: The War Within (10)                                               │
│                                                                              │
│ Binding: Binds when picked up (1)                                            │
│ Unique-Equipped: No                                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ STAT BREAKDOWN ────────────────────────────────────────────────────────────┐
│                                                                              │
│ ┌─ PRIMARY STATS ──────────────────────────────────────────────────────────┐ │
│ │ Stat              │ Base Value │ Budget % │ Rating     │ Converted       │ │
│ ├───────────────────┼────────────┼──────────┼────────────┼─────────────────┤ │
│ │ Intellect         │ 2,156      │ -        │ -          │ -               │ │
│ │ Stamina           │ 3,234      │ -        │ -          │ -               │ │
│ └───────────────────┴────────────┴──────────┴────────────┴─────────────────┘ │
│                                                                              │
│ ┌─ SECONDARY STATS ────────────────────────────────────────────────────────┐ │
│ │ Stat              │ Rating     │ Budget % │ @ Level 80 │ Diminished      │ │
│ ├───────────────────┼────────────┼──────────┼────────────┼─────────────────┤ │
│ │ Critical Strike   │ 847        │ 57%      │ 2.14%      │ 2.08%           │ │
│ │ Mastery           │ 635        │ 43%      │ 1.60%      │ 1.57%           │ │
│ └───────────────────┴────────────┴──────────┴────────────┴─────────────────┘ │
│                                                                              │
│ Total Secondary Budget: 1,482 (100%)                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ BONUS IDS ─────────────────────────────────────────────────────────────────┐
│                                                                              │
│ Current Bonus IDs: [1472, 10256, 10377, 10396, 10873, 11316]                 │
│                                                                              │
│ ┌─ BONUS BREAKDOWN ────────────────────────────────────────────────────────┐ │
│ │ ID     │ Type                   │ Value              │ Description       │ │
│ ├────────┼────────────────────────┼────────────────────┼───────────────────┤ │
│ │ 1472   │ Item Level (1)         │ +13                │ Heroic track base │ │
│ │ 10256  │ Stat Allocation (2)    │ [847, 635]         │ Crit/Mastery      │ │
│ │ 10377  │ Socket (6)             │ 1 Prismatic        │ Prismatic Socket  │ │
│ │ 10396  │ Tertiary (23)          │ -                  │ Speed/Leech/Avoid │ │
│ │ 10873  │ Scaling Curve (11)     │ Curve #2157        │ TWW Season 1      │ │
│ │ 11316  │ Upgrade Track (40)     │ Champion 4/8       │ Upgrade level     │ │
│ └────────┴────────────────────────┴────────────────────┴───────────────────┘ │
│                                                                              │
│ [+ Add Bonus ID]  [Simulate with these bonuses]                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ UPGRADE PATH ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ Season: The War Within Season 1                                              │
│ Track: Champion (580-593)                                                    │
│ Current Level: 4/8                                                           │
│                                                                              │
│ ┌─ UPGRADE LEVELS ─────────────────────────────────────────────────────────┐ │
│ │ Level │ iLvl │ Crest Cost        │ Flightstone Cost │ Source            │ │
│ ├───────┼──────┼───────────────────┼──────────────────┼───────────────────┤ │
│ │ 1/8   │ 580  │ 15 Weathered      │ 120              │ M0, Normal Raid   │ │
│ │ 2/8   │ 584  │ 15 Weathered      │ 120              │                   │ │
│ │ 3/8   │ 587  │ 15 Weathered      │ 120              │                   │ │
│ │ 4/8 ◄ │ 593  │ 15 Carved         │ 120              │                   │ │
│ │ 5/8   │ 597  │ 15 Carved         │ 120              │ M2-5, Heroic Raid │ │
│ │ 6/8   │ 600  │ 15 Carved         │ 120              │                   │ │
│ │ 7/8   │ 603  │ 15 Runed          │ 120              │ M6-9, Mythic Raid │ │
│ │ 8/8   │ 606  │ 15 Runed          │ 120              │                   │ │
│ └───────┴──────┴───────────────────┴──────────────────┴───────────────────┘ │
│                                                                              │
│ Hero Track (610-626): Requires upgrading to Champion 8/8 first               │
│ Myth Track (623-639): Requires Myth track item as base                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ITEM EFFECTS ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ [No on-use or on-equip effects]                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SOCKETS & GEMS ────────────────────────────────────────────────────────────┐
│                                                                              │
│ Socket 1: [Prismatic] - Empty                                                │
│                                                                              │
│ RECOMMENDED GEMS (by stat priority):                                         │
│ ├─ Inscribed Sapphire (+72 Crit / +54 Int)                                   │
│ ├─ Deadly Sapphire (+72 Crit / +54 Crit)                                     │
│ └─ Masterful Sapphire (+72 Mastery / +54 Mastery)                            │
│                                                                              │
│ Socket Bonus: N/A (Prismatic sockets have no bonus)                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SET BONUSES ───────────────────────────────────────────────────────────────┐
│                                                                              │
│ [Not part of a tier set]                                                     │
│                                                                              │
│ RELATED SETS:                                                                │
│ ├─ Mage Tier Set: "Sparks of Living Flame"                                   │
│ │   └─ Helm, Shoulder, Chest, Hands, Legs                                    │
│ ├─ Warlock Tier Set: "Grimoire of the Nerubian"                              │
│ │   └─ Helm, Shoulder, Chest, Hands, Legs                                    │
│ └─ Priest Tier Set: "Faith's Vesture"                                        │
│     └─ Helm, Shoulder, Chest, Hands, Legs                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ARMOR CALCULATION ─────────────────────────────────────────────────────────┐
│                                                                              │
│ Base Armor: 3,847                                                            │
│ Armor Type: Cloth                                                            │
│                                                                              │
│ Armor Formula:                                                               │
│ ItemArmorQuality[iLvl=593].Cloth * QualityMod[Epic] = 3,847                  │
│                                                                              │
│ Damage Reduction vs Level 80:                                                │
│ Physical DR: 23.4% (with this piece only)                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SPEC USABILITY ────────────────────────────────────────────────────────────┐
│                                                                              │
│ ┌─ PRIMARY STAT USERS ─────────────────────────────────────────────────────┐ │
│ │ Class         │ Specs Using Intellect Cloth                              │ │
│ ├───────────────┼──────────────────────────────────────────────────────────┤ │
│ │ Mage          │ ✓ Arcane, ✓ Fire, ✓ Frost                                │ │
│ │ Warlock       │ ✓ Affliction, ✓ Demonology, ✓ Destruction                │ │
│ │ Priest        │ ✓ Discipline, ✓ Holy, ✓ Shadow                           │ │
│ └───────────────┴──────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Stat Priority Match:                                                         │
│ ├─ Fire Mage: ★★★★☆ (Crit/Mastery is excellent)                              │
│ ├─ Frost Mage: ★★★☆☆ (Prefers Haste/Crit)                                    │
│ └─ Shadow Priest: ★★★☆☆ (Prefers Haste/Mastery)                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ DROP SOURCES ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ ┌─ LOOT SOURCES ───────────────────────────────────────────────────────────┐ │
│ │ Source              │ Difficulty    │ Base iLvl │ Drop Chance            │ │
│ ├─────────────────────┼───────────────┼───────────┼────────────────────────┤ │
│ │ Nerub-ar Palace     │ Normal        │ 571       │ ~15%                   │ │
│ │ Nerub-ar Palace     │ Heroic        │ 584       │ ~15%                   │ │
│ │ Nerub-ar Palace     │ Mythic        │ 597       │ ~15%                   │ │
│ │ M+ Dungeon End      │ +2            │ 584       │ 100% (Great Vault)     │ │
│ │ M+ Dungeon End      │ +10           │ 597       │ 100% (Great Vault)     │ │
│ │ Delves              │ Tier 8        │ 584       │ ~20%                   │ │
│ │ PvP Conquest        │ -             │ 580       │ Purchasable            │ │
│ └─────────────────────┴───────────────┴───────────┴────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ITEM FLAGS ────────────────────────────────────────────────────────────────┐
│                                                                              │
│ Flags[0]: 0x00000000                                                         │
│ Flags[1]: 0x00002000 - ITEM_FLAG_BIND_TO_ACCOUNT                             │
│ Flags[2]: 0x00800000 - ITEM_FLAG2_NO_DURABILITY                              │
│ Flags[3]: 0x00000000                                                         │
│ Flags[4]: 0x00000000                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ CRAFTING INFORMATION ──────────────────────────────────────────────────────┐
│                                                                              │
│ [Not a crafted item]                                                         │
│                                                                              │
│ Similar Crafted Items:                                                       │
│ └─ Weavercloth Vestments (iLvl 580-636, Tailoring)                           │
│     └─ Recipe: Pattern: Weavercloth Vestments                                │
│     └─ Materials: 25x Weavercloth, 5x Mystic Null Stone                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ RAW DATA INSPECTOR ────────────────────────────────────────────────────────┐
│                                                                              │
│ [Collapsible sections for raw CSV data]                                      │
│                                                                              │
│ ▶ Item.csv row                                                               │
│ ▶ ItemSparse.csv row                                                         │
│ ▶ ItemBonus.csv rows (6)                                                     │
│ ▶ ItemBonusTreeNode.csv rows (12)                                            │
│ ▶ ItemEffect.csv rows (0)                                                    │
│ ▶ ItemClass.csv row                                                          │
│ ▶ ItemSubClass.csv row                                                       │
│ ▶ ItemArmorQuality.csv row                                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SIMULATION INTEGRATION ────────────────────────────────────────────────────┐
│                                                                              │
│ [Compare in Top Gear]  [Add to Simulation]  [Export SimC String]             │
│                                                                              │
│ SimC Item String:                                                            │
│ chest=algari_competitors_cloth_vest,id=211980,bonus_id=1472/10256/10377/     │
│ 10396/10873/11316,ilevel=593,gem_id=213467                                   │
│                                                                              │
│ [Copy to Clipboard]                                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Additional Views for Trinkets/Weapons

### Trinket-Specific Sections

```
┌─ TRINKET EFFECT ANALYSIS ───────────────────────────────────────────────────┐
│                                                                              │
│ Effect Type: On-Use (requires activation)                                    │
│ Cooldown: 120s (shared CD category: 1141)                                    │
│                                                                              │
│ TRIGGERED SPELL: Spymasters Web (#444959)                                    │
│ ├─ Damage: 892,453 Shadow over 20s                                           │
│ ├─ Stacks: Builds 40 stacks from damage dealt                                │
│ ├─ Secondary Effect: +3,500 Primary Stat for 20s                             │
│ └─ [View Full Spell Details →]                                               │
│                                                                              │
│ ┌─ DPS CONTRIBUTION ───────────────────────────────────────────────────────┐ │
│ │ Scenario           │ Uptime │ Avg Damage │ DPS Contribution │ % of Total │ │
│ ├─────────────────────┼────────┼────────────┼──────────────────┼────────────┤ │
│ │ Patchwerk 5min     │ 16.7%  │ 892,453    │ 2,972            │ 1.2%       │ │
│ │ Dungeon Slice      │ 12.3%  │ 892,453    │ 2,189            │ 1.0%       │ │
│ │ Hectic Add Cleave  │ 16.7%  │ 1,784,906  │ 5,944            │ 1.8%       │ │
│ └─────────────────────┴────────┴────────────┴──────────────────┴────────────┘ │
│                                                                              │
│ SCALING:                                                                     │
│ ├─ Scales with: Primary Stat, Crit, Versatility                              │
│ ├─ Does NOT scale with: Haste, Mastery                                       │
│ └─ iLvl Scaling: +2.5% damage per 10 iLvl                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Weapon-Specific Sections

```
┌─ WEAPON STATS ──────────────────────────────────────────────────────────────┐
│                                                                              │
│ Type: Two-Hand Staff                                                         │
│ Speed: 3.60                                                                  │
│ DPS: 1,247.8                                                                 │
│ Damage: 3,743 - 5,615 (Shadow)                                               │
│                                                                              │
│ ┌─ DAMAGE BREAKDOWN ───────────────────────────────────────────────────────┐ │
│ │ Component       │ Value      │ Formula                                   │ │
│ ├─────────────────┼────────────┼───────────────────────────────────────────┤ │
│ │ Base Min        │ 3,743      │ DPS * Speed * (1 - Variance/2)            │ │
│ │ Base Max        │ 5,615      │ DPS * Speed * (1 + Variance/2)            │ │
│ │ Damage Variance │ 0.20       │ From ItemSparse.DmgVariance               │ │
│ │ School          │ Shadow     │ From ItemSparse.DamageType                │ │
│ └─────────────────┴────────────┴───────────────────────────────────────────┘ │
│                                                                              │
│ WEAPON SPEED IMPACT:                                                         │
│ ├─ Normalized Speed: 3.30 (for special attacks)                              │
│ ├─ Spell Power: Derived from DPS (2.5 * iLvl modifier)                       │
│ └─ Attack Power Contribution: N/A (caster weapon)                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Recommendations

### New Routes

```
/spell/[id]     → Spell detail view
/item/[id]      → Item detail view
/item/[id]/compare  → Compare with bonus ID variations
```

### New Data to Expose

#### For Spells

1. **SpellEffect rows** - All effects with coefficients, targets, mechanics
2. **SpellAuraOptions** - Proc data, RPPM, stacking
3. **SpellLabel** - For understanding talent interactions
4. **SpellDiminish** - DR categories (PvP)
5. **SpellProcsPerMinute + Mods** - RPPM mechanics

#### For Items

1. **Full ItemBonus decomposition** - Parse all bonus IDs with meanings
2. **ItemBonusTreeNode** - Show upgrade paths
3. **ItemBonusSeason** - Current season upgrade costs
4. **ItemSet + ItemSetSpell** - Tier set information
5. **Armor/Damage calculations** - Show formulas

### UI Components Needed

1. **AttributeFlagsViewer** - Collapsible bitfield inspector
2. **SpellEffectCard** - Individual effect display
3. **BonusIdBadge** - Clickable bonus ID with tooltip
4. **StatBudgetChart** - Visual secondary stat allocation
5. **UpgradePathTimeline** - Visual upgrade track display
6. **RawDataInspector** - Collapsible CSV row viewer
7. **SimulationExporter** - Generate SimC strings

### Existing Hooks to Extend

- `useSpell` → Add loading of related tables
- `useItem` → Add bonus ID resolution
- New `useSpellEffects(spellId)` → Load SpellEffect rows
- New `useItemBonuses(itemId, bonusIds[])` → Resolve bonus IDs

---

## Summary

This document outlines comprehensive detail views that expose simulation-relevant data:

**Spells:**

- All 16 attribute flags decoded
- Complete spell effect breakdown with coefficients
- RPPM mechanics and proc information
- Spell class masks for talent targeting
- Aura restrictions and shapeshift requirements
- Related spell chains (replacements, triggers)

**Items:**

- Full bonus ID decomposition with type meanings
- Upgrade path visualization
- Stat budget breakdown with percentages
- Armor/damage calculations with formulas
- Spec usability and stat priority matching
- SimC string generation

Both views include raw data inspectors for users who want to dive deeper into the underlying CSV data.
