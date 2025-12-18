# Item Inspector Data Requirements

## Current Implementation Status

### What We Have (`ItemDataFlat` from `useItem`)

**File:** `packages/wowlab-services/src/internal/data/transformer/item.ts`

| Field         | Type                                                            | Source                                                    | Status |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| id            | number                                                          | Item.ID                                                   | ✅     |
| name          | string                                                          | ItemSparse.Display_lang                                   | ✅     |
| description   | string                                                          | ItemSparse.Description_lang                               | ✅     |
| fileName      | string                                                          | ManifestInterfaceData (icon)                              | ✅     |
| quality       | number                                                          | ItemSparse.OverallQualityID                               | ✅     |
| itemLevel     | number                                                          | ItemSparse.ItemLevel                                      | ✅     |
| requiredLevel | number                                                          | ItemSparse.RequiredLevel                                  | ✅     |
| classId       | number                                                          | Item.ClassID                                              | ✅     |
| subclassId    | number                                                          | Item.SubclassID                                           | ✅     |
| inventoryType | number                                                          | Item.InventoryType                                        | ✅     |
| binding       | number                                                          | ItemSparse.Bonding                                        | ✅     |
| buyPrice      | number                                                          | ItemSparse.BuyPrice                                       | ✅     |
| sellPrice     | number                                                          | ItemSparse.SellPrice                                      | ✅     |
| maxCount      | number                                                          | ItemSparse.MaxCount                                       | ✅     |
| stackable     | number                                                          | ItemSparse.Stackable                                      | ✅     |
| speed         | number                                                          | ItemSparse.ItemDelay                                      | ✅     |
| stats         | { type, value }[]                                               | ItemSparse.StatModifier_bonusStat_X / StatPercentEditor_X | ✅     |
| effects       | { spellId, cooldown, charges, triggerType, categoryCooldown }[] | ItemXItemEffect + ItemEffect                              | ✅     |

### What's Missing (UI needs `ItemData` interface)

The UI components in `apps/portal/src/components/lab/inspector/item/` expect a much richer `ItemData` interface defined in `item-context.tsx`.

---

## Data Sources in wowlab-data

All DBC data is stored in `~/Source/wowlab-data/data/tables/` as CSV files.

### Core Item Tables (HAVE SCHEMAS)

| Table                      | CSV Schema                                                                                                                                                                                                                            | Status           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Item.csv                   | `ID, ClassID, SubclassID, Material, InventoryType, SheatheType, Sound_override_subclassID, IconFileDataID, ItemGroupSoundsID, ContentTuningID, ModifiedCraftingReagentItemID, ...`                                                    | ✅ Schema exists |
| ItemSparse.csv             | `ID, AllowableRace, Description_lang, Display_lang, ExpansionID, DmgVariance, Stackable, MaxCount, SellPrice, BuyPrice, Flags_0-4, ItemSet, ItemLevel, AllowableClass, SocketType_0-2, Bonding, RequiredLevel, OverallQualityID, ...` | ✅ Schema exists |
| ItemEffect.csv             | `ID, LegacySlotIndex, TriggerType, Charges, CoolDownMSec, CategoryCoolDownMSec, SpellCategoryID, SpellID, ChrSpecializationID, PlayerConditionID`                                                                                     | ✅ Schema exists |
| ItemXItemEffect.csv        | `ID, ItemEffectID, ItemID`                                                                                                                                                                                                            | ✅ Schema exists |
| ItemBonus.csv              | `ID, Value_0, Value_1, Value_2, Value_3, ParentItemBonusListID, Type, OrderIndex`                                                                                                                                                     | ✅ Schema exists |
| ItemBonusList.csv          | `ID, Flags`                                                                                                                                                                                                                           | ✅ Schema exists |
| ItemBonusTree.csv          | `ID, Flags, InventoryTypeSlotMask`                                                                                                                                                                                                    | ✅ Schema exists |
| ItemBonusTreeNode.csv      | `ID, ItemContext, ChildItemBonusTreeID, ChildItemBonusListID, ChildItemLevelSelectorID, ChildItemBonusListGroupID, ...`                                                                                                               | ✅ Schema exists |
| ItemModifiedAppearance.csv | `ID, ItemID, ItemAppearanceModifierID, ItemAppearanceID, OrderIndex, TransmogSourceTypeEnum, Flags`                                                                                                                                   | ✅ Schema exists |
| ItemAppearance.csv         | `ID, DisplayType, ItemDisplayInfoID, DefaultIconFileDataID, UiOrder, TransmogPlayerConditionID`                                                                                                                                       | ✅ Schema exists |
| ItemSetSpell.csv           | `ID, ChrSpecID, SpellID, TraitSubTreeID, Threshold, ItemSetID`                                                                                                                                                                        | ✅ Schema exists |
| ItemArmorQuality.csv       | `ID, Qualitymod_0-6`                                                                                                                                                                                                                  | ✅ Schema exists |
| ItemArmorShield.csv        | `ID, Quality_0-6, ItemLevel`                                                                                                                                                                                                          | ✅ Schema exists |
| ItemArmorTotal.csv         | `ID, ItemLevel, Cloth, Leather, Mail, Plate`                                                                                                                                                                                          | ✅ Schema exists |
| ItemDamageOneHand.csv      | `ID, ItemLevel, Quality_0-6`                                                                                                                                                                                                          | ✅ Schema exists |
| ItemDamageTwoHand.csv      | `ID, ItemLevel, Quality_0-6`                                                                                                                                                                                                          | ✅ Schema exists |
| SpellItemEnchantment.csv   | `ID, Name_lang, HordeName_lang, Duration, EffectArg_0-2, Flags, IconFileDataID, ItemLevelMin, ItemLevelMax, Effect_0-2, ...`                                                                                                          | ✅ Schema exists |

### Additional Item Tables (ALL SCHEMAS NOW EXIST)

| Table                           | CSV Schema                                                               | Used For              | Status           |
| ------------------------------- | ------------------------------------------------------------------------ | --------------------- | ---------------- |
| ItemSet.csv                     | `ID, Name_lang, SetFlags, RequiredSkill, RequiredSkillRank, ItemID_0-16` | Set bonuses           | ✅ Schema exists |
| ItemClass.csv                   | `ID, ClassName_lang, ClassID, PriceModifier, Flags`                      | Class name lookup     | ✅ Schema exists |
| ItemSubClass.csv                | `DisplayName_lang, VerboseName_lang, ID, ClassID, SubClassID, ...`       | Subclass name lookup  | ✅ Schema exists |
| ItemXBonusTree.csv              | `ID, ItemBonusTreeID, ItemID`                                            | Bonus tree lookup     | ✅ Schema exists |
| ItemBonusListGroup.csv          | `ID, SequenceSpellID, PlayerConditionID, ...`                            | Bonus list groups     | ✅ Schema exists |
| ItemBonusListGroupEntry.csv     | `ID, ItemBonusListGroupID, ItemBonusListID, ...`                         | Bonus list entries    | ✅ Schema exists |
| ItemNameDescription.csv         | `ID, Description_lang, Color`                                            | Name suffixes         | ✅ Schema exists |
| ItemBonusSeason.csv             | `ID, SeasonID`                                                           | Season upgrade tracks | ✅ Schema exists |
| ItemBonusSeasonUpgradeCost.csv  | `SourceText_lang, ID, CostItemID, ...`                                   | Upgrade costs         | ✅ Schema exists |
| JournalEncounterItem.csv        | `ID, JournalEncounterID, ItemID, ...`                                    | Drop sources          | ✅ Schema exists |
| JournalEncounter.csv            | `Name_lang, Description_lang, ID, JournalInstanceID, ...`                | Boss names            | ✅ Schema exists |
| JournalInstance.csv             | `ID, Name_lang, Description_lang, MapID, ...`                            | Instance names        | ✅ Schema exists |
| ModifiedCraftingReagentItem.csv | `ID, Description_lang, ModifiedCraftingCategoryID, ...`                  | Crafting info         | ✅ Schema exists |
| ChrClasses.csv                  | `Name_lang, ID, PrimaryStatPriority, ...`                                | Class usability       | ✅ Schema exists |
| ChrSpecialization.csv           | `Name_lang, ID, ClassID, Role, PrimaryStatPriority, ...`                 | Spec usability        | ✅ Schema exists |
| GemProperties.csv               | `ID, Enchant_ID, Type`                                                   | Gem details           | ✅ Schema exists |

---

## Data Needed by UI Cards

### HeaderCard

| Field                             | Status    | Source                                                                        |
| --------------------------------- | --------- | ----------------------------------------------------------------------------- |
| id, name, description, iconName   | ✅ HAVE   | ItemDataFlat                                                                  |
| quality, itemLevel, requiredLevel | ✅ HAVE   | ItemDataFlat                                                                  |
| binding ("BoP" \| "BoE" \| "BoU") | 🔄 MAP    | ItemDataFlat.binding (0=None, 1=BoP, 2=BoE, 3=BoU)                            |
| armor                             | ❌ NEED   | ItemSparse (field not in schema, need to check CSV)                           |
| classification.inventoryTypeName  | 🔄 LOOKUP | Static map from inventoryType                                                 |
| classification.subclassName       | 🔄 LOOKUP | ItemSubClass.DisplayName_lang                                                 |
| primaryStats[]                    | ✅ HAVE   | ItemDataFlat.stats (filter primary: 3=Agi, 4=Str, 5=Int, 7=Stam)              |
| secondaryStats[]                  | ✅ HAVE   | ItemDataFlat.stats (filter secondary: 32=Crit, 36=Haste, 40=Vers, 49=Mastery) |
| sockets[]                         | ❌ NEED   | ItemSparse.SocketType_0-2                                                     |

### ClassificationCard

| Field                            | Status    | Source                              |
| -------------------------------- | --------- | ----------------------------------- |
| classId, className               | 🔄 LOOKUP | ItemClass.ClassName_lang            |
| subclassId, subclassName         | 🔄 LOOKUP | ItemSubClass.DisplayName_lang       |
| inventoryType, inventoryTypeName | 🔄 LOOKUP | Static map                          |
| expansionId, expansionName       | ❌ NEED   | ItemSparse.ExpansionID + static map |
| quality, binding                 | ✅ HAVE   | ItemDataFlat                        |

### StatBreakdownCard

| Field                                   | Status       | Source                       |
| --------------------------------------- | ------------ | ---------------------------- |
| primaryStats[]                          | ✅ HAVE      | ItemDataFlat.stats           |
| secondaryStats[] with budget/diminished | 🔄 CALCULATE | Need formulas                |
| totalSecondaryBudget                    | 🔄 CALCULATE | Sum of secondary stat values |

### BonusIdsCard

| Field            | Status  | Source                                               |
| ---------------- | ------- | ---------------------------------------------------- |
| bonusIds[]       | ❌ NEED | ItemXBonusTree → ItemBonusTreeNode → ItemBonusListID |
| bonusBreakdown[] | ❌ NEED | ItemBonus table by ParentItemBonusListID             |

**ItemBonus.Type values:**

- 1 = Item Level Delta
- 2 = Stat (Value_0=stat type, Value_1=stat allocation)
- 3 = Quality
- 4 = Name Description
- 5 = Suffix (random enchant)
- 6 = Socket
- 7 = Appearance
- 11 = Scaling (content tuning)
- 13 = Required Level
- 14 = Item Level
- ...

### UpgradePathCard

| Field                     | Status  | Source                          |
| ------------------------- | ------- | ------------------------------- |
| season, track, trackRange | ❌ NEED | ItemBonusSeason + complex logic |
| currentLevel, maxLevel    | ❌ NEED | From bonus IDs                  |
| levels[]                  | ❌ NEED | ItemBonusSeasonUpgradeCost      |
| nextTracks[]              | ❌ SKIP | Editorial                       |

### SocketsCard

| Field             | Status  | Source                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sockets[]         | ❌ NEED | ItemSparse.SocketType_0-2 (0=None, 1=Meta, 2=Red, 3=Yellow, 4=Blue, 5=Hydraulic, 6=Cogwheel, 7=Prismatic, 8=Relic Iron, 9=Relic Blood, 10=Relic Shadow, 11=Relic Fel, 12=Relic Arcane, 13=Relic Frost, 14=Relic Fire, 15=Relic Water, 16=Relic Life, 17=Relic Storm, 18=Relic Holy, 19=Primordial, 20=Domination, 21=Cypher, 22=Tinker) |
| socketBonus       | ❌ NEED | ItemSparse.Socket_match_enchantment_ID → SpellItemEnchantment                                                                                                                                                                                                                                                                           |
| recommendedGems[] | ❌ SKIP | Editorial                                                                                                                                                                                                                                                                                                                               |

### SetBonusesCard

| Field         | Status  | Source                                                   |
| ------------- | ------- | -------------------------------------------------------- |
| setInfo       | ❌ NEED | ItemSparse.ItemSet → ItemSet.Name_lang, ItemID_0-16      |
| setBonuses    | ❌ NEED | ItemSetSpell (filtered by ItemSetID, group by Threshold) |
| relatedSets[] | ❌ SKIP | Editorial                                                |

### ItemEffectsCard

| Field                       | Status     | Source                                     |
| --------------------------- | ---------- | ------------------------------------------ |
| effects[] with descriptions | 🔄 ENHANCE | Have spellIds, need Spell.Description_lang |

### ArmorCalculationCard

| Field      | Status  | Source                           |
| ---------- | ------- | -------------------------------- |
| baseArmor  | ❌ NEED | Check ItemSparse for Armor field |
| armorType  | ✅ HAVE | subclassName                     |
| formula    | ❌ SKIP | Editorial                        |
| physicalDR | ❌ SKIP | Calculation                      |

### SpecUsabilityCard

| Field               | Status  | Source                                                               |
| ------------------- | ------- | -------------------------------------------------------------------- |
| primaryStatUsers[]  | ❌ NEED | ItemSparse.AllowableClass (bitmask) + ChrClasses + ChrSpecialization |
| statPriorityMatch[] | ❌ SKIP | Editorial                                                            |

**AllowableClass bitmask:**

- Bit 0 (1): Warrior
- Bit 1 (2): Paladin
- Bit 2 (4): Hunter
- Bit 3 (8): Rogue
- Bit 4 (16): Priest
- Bit 5 (32): Death Knight
- Bit 6 (64): Shaman
- Bit 7 (128): Mage
- Bit 8 (256): Warlock
- Bit 9 (512): Monk
- Bit 10 (1024): Druid
- Bit 11 (2048): Demon Hunter
- Bit 12 (4096): Evoker
- -1 = All classes

### DropSourcesCard

| Field         | Status  | Source                                                               |
| ------------- | ------- | -------------------------------------------------------------------- |
| dropSources[] | ❌ NEED | JournalEncounterItem.JournalEncounterID → JournalEncounter.Name_lang |

### ItemFlagsCard

| Field   | Status  | Source                             |
| ------- | ------- | ---------------------------------- |
| flags[] | ❌ NEED | ItemSparse.Flags_0 through Flags_4 |

**Common Flags_0 values:**

- 0x1 = Soulbound
- 0x2 = Conjured
- 0x4 = Openable
- 0x8 = Heroic
- 0x10 = Deprecated
- 0x20 = Indestructible
- 0x40 = Usable
- 0x80 = No Equip Cooldown
- 0x100 = Wrapper
- 0x200 = Ignore Bag Space
- 0x400 = Party Loot
- 0x800 = Refundable
- 0x1000 = Charter
- 0x2000 = Letter
- 0x4000 = PvP
- 0x8000 = Unique Equipped
- 0x10000 = No Class Requirement
- 0x20000 = Account Bound
- 0x40000 = Enchant Scroll
- 0x80000 = Millable
- 0x100000 = Unknown
- 0x200000 = Reputation Tooltip
- ...

### CraftingCard

| Field                 | Status  | Source                                                           |
| --------------------- | ------- | ---------------------------------------------------------------- |
| craftingInfo          | ❌ NEED | Item.ModifiedCraftingReagentItemID → ModifiedCraftingReagentItem |
| similarCraftedItems[] | ❌ SKIP | Editorial                                                        |

### RawDataCard

| Field               | Status     | Source                     |
| ------------------- | ---------- | -------------------------- |
| rawData.item        | ✅ CAN ADD | Return full Item row       |
| rawData.itemSparse  | ✅ CAN ADD | Return full ItemSparse row |
| rawData.itemBonus[] | ❌ NEED    | ItemBonus rows             |

### SimulationCard

| Field      | Status      | Source               |
| ---------- | ----------- | -------------------- |
| simcString | 🔄 GENERATE | Build from item data |

---

## Fields Missing from ItemSparse Schema

The `ItemSparseSchema.ts` is missing these fields that exist in the CSV:

```
Field_12_0_0_63534_032 (unnamed)
Field_12_0_0_63534_033 (unnamed)
Field_12_0_0_63534_034 (unnamed)
ItemNameDescriptionID
```

Note: The CSV doesn't have an "Armor" column directly - armor is calculated from:

- ItemArmorTotal (base armor by itemLevel and armor type)
- ItemArmorQuality (quality modifier)
- ItemArmorShield (shield armor by itemLevel and quality)

---

## Implementation Plan

### Phase 1 - Extend ItemDataFlat (No New Tables)

1. **Add fields already in ItemSparse schema:**
   - `expansionId` from ItemSparse.ExpansionID
   - `flags` array from ItemSparse.Flags_0-4
   - `sockets` array from ItemSparse.SocketType_0-2
   - `socketBonusEnchantId` from ItemSparse.Socket_match_enchantment_ID
   - `itemSetId` from ItemSparse.ItemSet
   - `allowableClass` from ItemSparse.AllowableClass
   - `allowableRace` from ItemSparse.AllowableRace
   - `gemProperties` from ItemSparse.Gem_properties
   - `dmgVariance` from ItemSparse.DmgVariance

2. **Add lookup tables (static maps in code):**
   - Binding number → "BoP" | "BoE" | "BoU"
   - InventoryType number → name string
   - Stat type number → name string
   - Expansion ID → name string
   - Socket type number → name string
   - Flag bitmask → description array

### Phase 2 - Add Lookup Table Schemas

1. **ItemClass schema** - for className lookup
2. **ItemSubClass schema** - for subclassName lookup
3. **ItemSet schema** - for set name and pieces
4. **Add DbcService methods:**
   - `getItemClass(classId)`
   - `getItemSubClass(classId, subclassId)`
   - `getItemSet(setId)`
   - `getItemSetSpells(setId)`

### Phase 3 - Bonus System

1. **Add schemas:**
   - ItemXBonusTree
   - ItemBonusListGroup
   - ItemBonusListGroupEntry

2. **Add DbcService methods:**
   - `getItemBonusTree(itemId)` - get default bonus tree
   - `getItemBonuses(bonusListId)` - get all bonuses for a list
   - `decodeBonus(bonus)` - interpret bonus type and values

### Phase 4 - Complex Features

1. **Drop sources:** JournalEncounterItem + JournalEncounter
2. **Upgrade paths:** ItemBonusSeason + ItemBonusSeasonUpgradeCost (complex logic)
3. **Crafting:** ModifiedCraftingReagentItem + related tables
4. **Armor calculation:** ItemArmorTotal + ItemArmorQuality formulas

---

## Armor Calculation Reference

Base armor formula uses ItemArmorTotal lookup by itemLevel:

```
baseArmor = ItemArmorTotal[itemLevel][armorType]
// armorType: 0=Cloth, 1=Leather, 2=Mail, 3=Plate
```

Quality modifier from ItemArmorQuality:

```
qualityMod = ItemArmorQuality[1].Qualitymod_X  // X = quality (0-6)
```

Final armor:

```
armor = floor(baseArmor * qualityMod * slotModifier)
```

Slot modifiers vary by inventory type (chest = 1.0, helm = 0.75, etc.)

---

## Wowhead Reference Data

Example item 219340 (Glyph-Etched Cuisses):

- Armor: 4,054
- Agility/Intellect: +2,129
- Stamina: +3,194
- Random Stats: +728 each
- Durability: 120/120
- Sell Price: 101g 13s 85c
- Display ID: 682361
- Bonus IDs: [10421, 9633, 8902]
- Bonus Trees: [4297]
- Source: Crafted
