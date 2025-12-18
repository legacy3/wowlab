# Item Inspector Data Requirements

## Current API (`ItemDataFlat` from `useItem`)

What we currently fetch from DBC:

| Field | Type | Source |
|-------|------|--------|
| id | number | Item.ID |
| name | string | ItemSparse.Display_lang |
| description | string | ItemSparse.Description_lang |
| fileName | string | ManifestInterfaceData (icon) |
| quality | number | ItemSparse.OverallQualityID |
| itemLevel | number | ItemSparse.ItemLevel |
| requiredLevel | number | ItemSparse.RequiredLevel |
| classId | number | Item.ClassID |
| subclassId | number | Item.SubclassID |
| inventoryType | number | Item.InventoryType |
| binding | number | ItemSparse.Bonding |
| buyPrice | number | ItemSparse.BuyPrice |
| sellPrice | number | ItemSparse.SellPrice |
| maxCount | number | ItemSparse.MaxCount |
| stackable | number | ItemSparse.Stackable |
| speed | number | ItemSparse.ItemDelay |
| stats | { type, value }[] | ItemSparse.StatModifier_bonusStat_X / StatPercentEditor_X |
| effects | { spellId, cooldown, charges, triggerType, categoryCooldown }[] | ItemXItemEffect + ItemEffect |

## Data Needed by UI Cards

### HeaderCard
- `id`, `name`, `description`, `iconName` - HAVE
- `quality`, `itemLevel`, `requiredLevel` - HAVE
- `binding` ("BoP" | "BoE" | "BoU") - HAVE (need to map number to string)
- `armor` - NEED (ItemSparse has this)
- `classification.inventoryTypeName`, `classification.subclassName` - HAVE (need lookup tables)
- `primaryStats[]`: `{ name, value }` - HAVE
- `secondaryStats[]`: `{ name, rating }` - HAVE
- `sockets[]`: `{ type, gem }` - NEED

### ClassificationCard
- `classification.classId`, `className` - HAVE
- `classification.subclassId`, `subclassName` - HAVE
- `classification.inventoryType`, `inventoryTypeName` - HAVE
- `classification.expansionId`, `expansionName` - NEED (ItemSparse.ExpansionID?)
- `quality`, `binding` - HAVE

### StatBreakdownCard
- `primaryStats[]`: `{ name, value }` - HAVE
- `secondaryStats[]`: `{ name, rating, budgetPercent, percentAtLevel, diminishedPercent }` - PARTIAL (have rating, rest needs calculation)
- `totalSecondaryBudget` - CAN CALCULATE

### BonusIdsCard
- `bonusIds[]` - NEED (from item string or ItemBonus table)
- `bonusBreakdown[]`: `{ id, type, typeId, value, description }` - NEED (ItemBonus table)

### UpgradePathCard
- `upgradePath.season`, `track`, `trackRange` - NEED (complex, involves multiple tables)
- `upgradePath.currentLevel`, `maxLevel` - NEED
- `upgradePath.levels[]` - NEED
- `upgradePath.nextTracks[]` - NEED

### SocketsCard
- `sockets[]`: `{ type, gem }` - NEED (ItemSparse socket fields or bonus IDs)
- `recommendedGems[]` - SKIP (editorial content)
- `socketBonus` - NEED

### SetBonusesCard
- `setInfo` - NEED (ItemSet table)
- `relatedSets[]` - SKIP (editorial content)

### ItemEffectsCard
- `effects[]` (spell descriptions) - PARTIAL (have spellIds, need descriptions)

### ArmorCalculationCard
- `armorCalculation.baseArmor` - NEED (ItemSparse)
- `armorCalculation.armorType` - HAVE (subclass name)
- `armorCalculation.formula` - SKIP (editorial)
- `armorCalculation.physicalDR` - SKIP (needs calculation at specific level)

### SpecUsabilityCard
- `specUsability.primaryStatUsers[]` - NEED (AllowableClass/Race masks + spec data)
- `specUsability.statPriorityMatch[]` - SKIP (editorial content)

### DropSourcesCard
- `dropSources[]` - NEED (JournalEncounterItem or external API)

### ItemFlagsCard
- `flags[]`: `{ index, value, description }` - NEED (ItemSparse.Flags_X fields)

### CraftingCard
- `craftingInfo` - NEED (ModifiedCraftingReagentItem, etc.)
- `similarCraftedItems[]` - SKIP (editorial)

### RawDataCard
- `rawData.item` - HAVE (can include)
- `rawData.itemSparse` - HAVE (can include)
- `rawData.itemBonus[]` - NEED

### SimulationCard
- `simcString` - CAN GENERATE from item data

## Additional DBC Fields Available (Not Currently Fetched)

From `ItemSparse`:
- `Armor` - armor value
- `DmgMin1`, `DmgMax1` - weapon damage
- `Durability` - durability
- `ExpansionID` - expansion
- `Flags_0` through `Flags_4` - item flags
- `SocketType_0`, `SocketType_1`, `SocketType_2` - socket types
- `socketBonus` - socket bonus spell
- `AllowableClass` - class mask
- `AllowableRace` - race mask
- `SheatheType` - sheathe type
- `Material` - material type
- `GemProperties` - if item is a gem

From `ItemBonus`:
- Bonus ID breakdowns
- Stat modifications
- Socket additions
- Item level modifications

From `ItemSet`:
- Set name
- Set bonuses (2pc, 4pc spells)
- Required pieces

## Priority for Implementation

### Phase 1 - Core Data (use what DBC has)
1. Armor value from ItemSparse
2. Flags from ItemSparse
3. Sockets from ItemSparse
4. Expansion ID
5. Raw data passthrough

### Phase 2 - Enhanced Data
1. Bonus ID parsing (ItemBonus table)
2. Item set info (ItemSet table)
3. Spell effect descriptions
4. Class/spec usability from masks

### Phase 3 - Complex Features (may need external data)
1. Drop sources
2. Upgrade paths
3. Crafting info

## Wowhead Data (for reference)

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
