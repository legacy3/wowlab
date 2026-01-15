//! DBC CSV loader
//!
//! Loads WoW DBC (Database Client) tables from CSV files into indexed HashMaps.
//! Tables are indexed either by their primary ID or by foreign key for fast lookups.

use std::collections::HashMap;
use std::path::Path;

use crate::errors::DbcError;
use crate::dbc::rows::*;

/// Container for all loaded DBC data with indexed lookups.
///
/// Tables are organized into groups:
/// - Spell tables: Core spell data and related attributes
/// - Character tables: Specs and classes
/// - Talent tables: Trait system data (talents since Dragonflight)
#[derive(Debug)]
pub struct DbcData {
    // Spell tables indexed by ID
    pub spell_name: HashMap<i32, SpellNameRow>,
    pub spell: HashMap<i32, SpellRow>,
    pub spell_cast_times: HashMap<i32, SpellCastTimesRow>,
    pub spell_duration: HashMap<i32, SpellDurationRow>,
    pub spell_range: HashMap<i32, SpellRangeRow>,
    pub spell_radius: HashMap<i32, SpellRadiusRow>,
    pub spell_category: HashMap<i32, SpellCategoryRow>,
    pub spell_description_variables: HashMap<i32, SpellDescriptionVariablesRow>,
    pub difficulty: HashMap<i32, DifficultyRow>,
    pub manifest_interface_data: HashMap<i32, ManifestInterfaceDataRow>,

    // Spell tables indexed by SpellID
    pub spell_misc: HashMap<i32, SpellMiscRow>,
    pub spell_effect: HashMap<i32, Vec<SpellEffectRow>>,
    pub spell_power: HashMap<i32, Vec<SpellPowerRow>>,
    pub spell_cooldowns: HashMap<i32, SpellCooldownsRow>,
    pub spell_categories: HashMap<i32, SpellCategoriesRow>,
    pub spell_class_options: HashMap<i32, SpellClassOptionsRow>,
    pub spell_aura_restrictions: HashMap<i32, SpellAuraRestrictionsRow>,
    pub spell_interrupts: HashMap<i32, SpellInterruptsRow>,
    pub spell_empower: HashMap<i32, SpellEmpowerRow>,
    pub spell_empower_stage: HashMap<i32, Vec<SpellEmpowerStageRow>>,
    pub spell_target_restrictions: HashMap<i32, SpellTargetRestrictionsRow>,
    pub spell_levels: HashMap<i32, Vec<SpellLevelsRow>>,
    pub spell_learn_spell: HashMap<i32, Vec<SpellLearnSpellRow>>,
    pub spell_replacement: HashMap<i32, SpellReplacementRow>,
    pub spell_shapeshift: HashMap<i32, SpellShapeshiftRow>,
    pub spell_totems: HashMap<i32, Vec<SpellTotemsRow>>,
    pub spell_x_description_variables: HashMap<i32, Vec<SpellXDescriptionVariablesRow>>,
    pub spell_aura_options: HashMap<i32, SpellAuraOptionsRow>,

    // Character tables
    pub chr_specialization: HashMap<i32, ChrSpecializationRow>,
    pub chr_classes: HashMap<i32, ChrClassesRow>,
    pub specialization_spells: HashMap<i32, Vec<SpecializationSpellsRow>>,

    // Talent tables indexed by ID
    pub trait_node: HashMap<i32, TraitNodeRow>,
    pub trait_node_entry: HashMap<i32, TraitNodeEntryRow>,
    pub trait_definition: HashMap<i32, TraitDefinitionRow>,
    pub trait_tree_loadout: HashMap<i32, TraitTreeLoadoutRow>,
    pub trait_sub_tree: HashMap<i32, TraitSubTreeRow>,
    pub trait_currency: HashMap<i32, TraitCurrencyRow>,
    pub trait_cost: HashMap<i32, TraitCostRow>,
    pub trait_cond: HashMap<i32, TraitCondRow>,
    pub ui_texture_atlas_element: HashMap<i32, UiTextureAtlasElementRow>,

    // Talent tables indexed by foreign key
    pub trait_node_by_tree: HashMap<i32, Vec<TraitNodeRow>>,
    pub trait_tree_loadout_by_spec: HashMap<i32, Vec<TraitTreeLoadoutRow>>,
    pub trait_tree_loadout_entry: HashMap<i32, Vec<TraitTreeLoadoutEntryRow>>,
    pub trait_edge: HashMap<i32, Vec<TraitEdgeRow>>,
    pub trait_node_x_trait_node_entry: HashMap<i32, Vec<TraitNodeXTraitNodeEntryRow>>,
    pub trait_tree_x_trait_currency: HashMap<i32, Vec<TraitTreeXTraitCurrencyRow>>,
    pub trait_currency_source: HashMap<i32, Vec<TraitCurrencySourceRow>>,
    pub trait_node_group_x_trait_node: HashMap<i32, Vec<TraitNodeGroupXTraitNodeRow>>,
    pub trait_node_group_x_trait_cost: HashMap<i32, Vec<TraitNodeGroupXTraitCostRow>>,
    pub trait_node_group_x_trait_cond: HashMap<i32, Vec<TraitNodeGroupXTraitCondRow>>,
    pub trait_node_x_trait_cond: HashMap<i32, Vec<TraitNodeXTraitCondRow>>,
    pub trait_cond_by_node_group: HashMap<i32, Vec<TraitCondRow>>,
    pub spec_set_member: HashMap<i32, Vec<SpecSetMemberRow>>,

    // Item tables indexed by ID
    pub item: HashMap<i32, ItemRow>,
    pub item_sparse: HashMap<i32, ItemSparseRow>,
    pub item_effect: HashMap<i32, ItemEffectRow>,
    pub item_set: HashMap<i32, ItemSetRow>,
    pub item_class: HashMap<i32, ItemClassRow>,
    pub item_sub_class: HashMap<i32, ItemSubClassRow>,
    pub item_appearance: HashMap<i32, ItemAppearanceRow>,
    pub journal_encounter: HashMap<i32, JournalEncounterRow>,
    pub journal_instance: HashMap<i32, JournalInstanceRow>,

    // Item tables indexed by foreign key
    pub item_x_item_effect: HashMap<i32, Vec<ItemXItemEffectRow>>,
    pub item_set_spell: HashMap<i32, Vec<ItemSetSpellRow>>,
    pub item_modified_appearance: HashMap<i32, ItemModifiedAppearanceRow>,
    pub item_class_by_class_id: HashMap<i32, ItemClassRow>,
    pub item_sub_class_by_class_id: HashMap<i32, Vec<ItemSubClassRow>>,
    pub journal_encounter_item: HashMap<i32, Vec<JournalEncounterItemRow>>,

    // Global tables
    pub global_color: HashMap<i32, GlobalColorRow>,
    pub global_strings: HashMap<i32, GlobalStringsRow>,
}

impl DbcData {
    /// Load all DBC tables from CSV files in the given directory.
    ///
    /// Expects the directory structure: `{data_dir}/data/tables/*.csv`
    pub fn load_all(data_dir: &Path) -> Result<Self, DbcError> {
        let tables_dir = data_dir.join("data").join("tables");

        let spell_name = load_by_id::<SpellNameRow>(&tables_dir, "SpellName")?;
        let spell = load_by_id::<SpellRow>(&tables_dir, "Spell")?;
        let spell_cast_times = load_by_id::<SpellCastTimesRow>(&tables_dir, "SpellCastTimes")?;
        let spell_duration = load_by_id::<SpellDurationRow>(&tables_dir, "SpellDuration")?;
        let spell_range = load_by_id::<SpellRangeRow>(&tables_dir, "SpellRange")?;
        let spell_radius = load_by_id::<SpellRadiusRow>(&tables_dir, "SpellRadius")?;
        let spell_category = load_by_id::<SpellCategoryRow>(&tables_dir, "SpellCategory")?;
        let spell_description_variables = load_by_id::<SpellDescriptionVariablesRow>(&tables_dir, "SpellDescriptionVariables")?;
        let difficulty = load_by_id::<DifficultyRow>(&tables_dir, "Difficulty")?;
        let manifest_interface_data = load_by_id::<ManifestInterfaceDataRow>(&tables_dir, "ManifestInterfaceData")?;

        // Spell tables indexed by SpellID
        let spell_misc = load_one_by_fk::<SpellMiscRow>(&tables_dir, "SpellMisc")?;
        let spell_effect = load_by_fk::<SpellEffectRow>(&tables_dir, "SpellEffect")?;
        let spell_power = load_by_fk::<SpellPowerRow>(&tables_dir, "SpellPower")?;
        let spell_cooldowns = load_one_by_fk::<SpellCooldownsRow>(&tables_dir, "SpellCooldowns")?;
        let spell_categories = load_one_by_fk::<SpellCategoriesRow>(&tables_dir, "SpellCategories")?;
        let spell_class_options = load_one_by_fk::<SpellClassOptionsRow>(&tables_dir, "SpellClassOptions")?;
        let spell_aura_restrictions = load_one_by_fk::<SpellAuraRestrictionsRow>(&tables_dir, "SpellAuraRestrictions")?;
        let spell_interrupts = load_one_by_fk::<SpellInterruptsRow>(&tables_dir, "SpellInterrupts")?;
        let spell_empower = load_one_by_fk::<SpellEmpowerRow>(&tables_dir, "SpellEmpower")?;
        let spell_empower_stage = load_by_fk::<SpellEmpowerStageRow>(&tables_dir, "SpellEmpowerStage")?;
        let spell_target_restrictions = load_one_by_fk::<SpellTargetRestrictionsRow>(&tables_dir, "SpellTargetRestrictions")?;
        let spell_levels = load_by_fk::<SpellLevelsRow>(&tables_dir, "SpellLevels")?;
        let spell_learn_spell = load_by_fk::<SpellLearnSpellRow>(&tables_dir, "SpellLearnSpell")?;
        let spell_replacement = load_one_by_fk::<SpellReplacementRow>(&tables_dir, "SpellReplacement")?;
        let spell_shapeshift = load_one_by_fk::<SpellShapeshiftRow>(&tables_dir, "SpellShapeshift")?;
        let spell_totems = load_by_fk::<SpellTotemsRow>(&tables_dir, "SpellTotems")?;
        let spell_x_description_variables = load_by_fk::<SpellXDescriptionVariablesRow>(&tables_dir, "SpellXDescriptionVariables")?;
        let spell_aura_options = load_one_by_fk::<SpellAuraOptionsRow>(&tables_dir, "SpellAuraOptions")?;

        // Character tables
        let chr_specialization = load_by_id::<ChrSpecializationRow>(&tables_dir, "ChrSpecialization")?;
        let chr_classes = load_by_id::<ChrClassesRow>(&tables_dir, "ChrClasses")?;
        let specialization_spells = load_by_fk::<SpecializationSpellsRow>(&tables_dir, "SpecializationSpells")?;

        // Talent tables indexed by ID
        let trait_node = load_by_id::<TraitNodeRow>(&tables_dir, "TraitNode")?;
        let trait_node_entry = load_by_id::<TraitNodeEntryRow>(&tables_dir, "TraitNodeEntry")?;
        let trait_definition = load_by_id::<TraitDefinitionRow>(&tables_dir, "TraitDefinition")?;
        let trait_tree_loadout = load_by_id::<TraitTreeLoadoutRow>(&tables_dir, "TraitTreeLoadout")?;
        let trait_sub_tree = load_by_id::<TraitSubTreeRow>(&tables_dir, "TraitSubTree")?;
        let trait_currency = load_by_id::<TraitCurrencyRow>(&tables_dir, "TraitCurrency")?;
        let trait_cost = load_by_id::<TraitCostRow>(&tables_dir, "TraitCost")?;
        let trait_cond = load_by_id::<TraitCondRow>(&tables_dir, "TraitCond")?;
        let ui_texture_atlas_element = load_by_id::<UiTextureAtlasElementRow>(&tables_dir, "UiTextureAtlasElement")?;

        // Build secondary indices for talent tables
        let trait_node_by_tree = group_by(&trait_node, |n| n.TraitTreeID);
        let trait_tree_loadout_by_spec = group_by(&trait_tree_loadout, |l| l.ChrSpecializationID);

        // Talent tables indexed by foreign key
        let trait_tree_loadout_entry = load_by_fk::<TraitTreeLoadoutEntryRow>(&tables_dir, "TraitTreeLoadoutEntry")?;
        let trait_edge = load_by_fk::<TraitEdgeRow>(&tables_dir, "TraitEdge")?;
        let trait_node_x_trait_node_entry = load_by_fk::<TraitNodeXTraitNodeEntryRow>(&tables_dir, "TraitNodeXTraitNodeEntry")?;
        let trait_tree_x_trait_currency = load_by_fk::<TraitTreeXTraitCurrencyRow>(&tables_dir, "TraitTreeXTraitCurrency")?;
        let trait_currency_source = load_by_fk::<TraitCurrencySourceRow>(&tables_dir, "TraitCurrencySource")?;
        let trait_node_group_x_trait_node = load_by_fk::<TraitNodeGroupXTraitNodeRow>(&tables_dir, "TraitNodeGroupXTraitNode")?;
        let trait_node_group_x_trait_cost = load_by_fk::<TraitNodeGroupXTraitCostRow>(&tables_dir, "TraitNodeGroupXTraitCost")?;
        let trait_node_group_x_trait_cond = load_by_fk::<TraitNodeGroupXTraitCondRow>(&tables_dir, "TraitNodeGroupXTraitCond")?;
        let trait_node_x_trait_cond = load_by_fk::<TraitNodeXTraitCondRow>(&tables_dir, "TraitNodeXTraitCond")?;
        let spec_set_member = load_by_fk::<SpecSetMemberRow>(&tables_dir, "SpecSetMember")?;

        // Index trait conditions by node group for fast lookup
        let trait_cond_by_node_group = group_by_filtered(&trait_cond, |c| c.TraitNodeGroupID, |c| c.TraitNodeGroupID > 0);

        // Item tables indexed by ID
        let item = load_by_id::<ItemRow>(&tables_dir, "Item")?;
        let item_sparse = load_by_id::<ItemSparseRow>(&tables_dir, "ItemSparse")?;
        let item_effect = load_by_id::<ItemEffectRow>(&tables_dir, "ItemEffect")?;
        let item_set = load_by_id::<ItemSetRow>(&tables_dir, "ItemSet")?;
        let item_class = load_by_id::<ItemClassRow>(&tables_dir, "ItemClass")?;
        let item_sub_class = load_by_id::<ItemSubClassRow>(&tables_dir, "ItemSubClass")?;
        let item_appearance = load_by_id::<ItemAppearanceRow>(&tables_dir, "ItemAppearance")?;
        let journal_encounter = load_by_id::<JournalEncounterRow>(&tables_dir, "JournalEncounter")?;
        let journal_instance = load_by_id::<JournalInstanceRow>(&tables_dir, "JournalInstance")?;

        // Item tables indexed by foreign key
        let item_x_item_effect = load_by_fk::<ItemXItemEffectRow>(&tables_dir, "ItemXItemEffect")?;
        let item_set_spell = load_by_fk::<ItemSetSpellRow>(&tables_dir, "ItemSetSpell")?;
        let item_modified_appearance = load_one_by_fk::<ItemModifiedAppearanceRow>(&tables_dir, "ItemModifiedAppearance")?;
        let journal_encounter_item = load_by_fk::<JournalEncounterItemRow>(&tables_dir, "JournalEncounterItem")?;

        // Build secondary indices for item tables
        let item_class_by_class_id = group_one_by(&item_class, |c| c.ClassID);
        let item_sub_class_by_class_id = group_by(&item_sub_class, |c| c.ClassID);

        // Global tables
        let global_color = load_by_id::<GlobalColorRow>(&tables_dir, "GlobalColor")?;
        let global_strings = load_by_id::<GlobalStringsRow>(&tables_dir, "GlobalStrings")?;

        Ok(Self {
            // Spell tables
            spell_name,
            spell,
            spell_cast_times,
            spell_duration,
            spell_range,
            spell_radius,
            spell_category,
            spell_description_variables,
            difficulty,
            manifest_interface_data,
            spell_misc,
            spell_effect,
            spell_power,
            spell_cooldowns,
            spell_categories,
            spell_class_options,
            spell_aura_restrictions,
            spell_interrupts,
            spell_empower,
            spell_empower_stage,
            spell_target_restrictions,
            spell_levels,
            spell_learn_spell,
            spell_replacement,
            spell_shapeshift,
            spell_totems,
            spell_x_description_variables,
            spell_aura_options,

            // Character tables
            chr_specialization,
            chr_classes,
            specialization_spells,

            // Talent tables
            trait_node,
            trait_node_entry,
            trait_definition,
            trait_tree_loadout,
            trait_sub_tree,
            trait_currency,
            trait_cost,
            trait_cond,
            ui_texture_atlas_element,
            trait_node_by_tree,
            trait_tree_loadout_by_spec,
            trait_tree_loadout_entry,
            trait_edge,
            trait_node_x_trait_node_entry,
            trait_tree_x_trait_currency,
            trait_currency_source,
            trait_node_group_x_trait_node,
            trait_node_group_x_trait_cost,
            trait_node_group_x_trait_cond,
            trait_node_x_trait_cond,
            trait_cond_by_node_group,
            spec_set_member,

            // Item tables
            item,
            item_sparse,
            item_effect,
            item_set,
            item_class,
            item_sub_class,
            item_appearance,
            journal_encounter,
            journal_instance,
            item_x_item_effect,
            item_set_spell,
            item_modified_appearance,
            item_class_by_class_id,
            item_sub_class_by_class_id,
            journal_encounter_item,

            // Global tables
            global_color,
            global_strings,
        })
    }

}

// ============================================================================
// CSV Loading Helpers
// ============================================================================

/// Load a CSV file into a HashMap indexed by row ID.
fn load_by_id<T: serde::de::DeserializeOwned + HasId>(
    path: &Path,
    table_name: &str,
) -> Result<HashMap<i32, T>, DbcError> {
    let file_path = path.join(format!("{}.csv", table_name));
    if !file_path.exists() {
        return Ok(HashMap::new());
    }

    let mut reader = csv::Reader::from_path(&file_path).map_err(|e| DbcError::CsvRead {
        path: file_path.display().to_string(),
        source: e,
    })?;

    let mut map = HashMap::new();
    for result in reader.deserialize() {
        let row: T = result.map_err(|e| DbcError::CsvParse {
            table: table_name.to_string(),
            source: e,
        })?;
        map.insert(row.id(), row);
    }

    Ok(map)
}

/// Load a CSV file and group rows by foreign key (one-to-many).
fn load_by_fk<T: serde::de::DeserializeOwned + HasFk>(
    path: &Path,
    table_name: &str,
) -> Result<HashMap<i32, Vec<T>>, DbcError> {
    let file_path = path.join(format!("{}.csv", table_name));
    if !file_path.exists() {
        return Ok(HashMap::new());
    }

    let mut reader = csv::Reader::from_path(&file_path).map_err(|e| DbcError::CsvRead {
        path: file_path.display().to_string(),
        source: e,
    })?;

    let mut map: HashMap<i32, Vec<T>> = HashMap::new();
    for result in reader.deserialize() {
        let row: T = result.map_err(|e| DbcError::CsvParse {
            table: table_name.to_string(),
            source: e,
        })?;
        map.entry(row.fk()).or_default().push(row);
    }

    Ok(map)
}

/// Load a CSV file indexed by foreign key (one-to-one, first match wins).
fn load_one_by_fk<T: serde::de::DeserializeOwned + HasFk>(
    path: &Path,
    table_name: &str,
) -> Result<HashMap<i32, T>, DbcError> {
    let file_path = path.join(format!("{}.csv", table_name));
    if !file_path.exists() {
        return Ok(HashMap::new());
    }

    let mut reader = csv::Reader::from_path(&file_path).map_err(|e| DbcError::CsvRead {
        path: file_path.display().to_string(),
        source: e,
    })?;

    let mut map = HashMap::new();
    for result in reader.deserialize() {
        let row: T = result.map_err(|e| DbcError::CsvParse {
            table: table_name.to_string(),
            source: e,
        })?;
        map.entry(row.fk()).or_insert(row);
    }

    Ok(map)
}

/// Group an existing HashMap's values by a key function.
fn group_by<T: Clone, F: Fn(&T) -> i32>(source: &HashMap<i32, T>, key_fn: F) -> HashMap<i32, Vec<T>> {
    let mut map: HashMap<i32, Vec<T>> = HashMap::new();
    for value in source.values() {
        map.entry(key_fn(value)).or_default().push(value.clone());
    }
    map
}

/// Group an existing HashMap's values by a key function, filtering by predicate.
fn group_by_filtered<T: Clone, F: Fn(&T) -> i32, P: Fn(&T) -> bool>(
    source: &HashMap<i32, T>,
    key_fn: F,
    predicate: P,
) -> HashMap<i32, Vec<T>> {
    let mut map: HashMap<i32, Vec<T>> = HashMap::new();
    for value in source.values() {
        if predicate(value) {
            map.entry(key_fn(value)).or_default().push(value.clone());
        }
    }
    map
}

/// Group an existing HashMap's values by a key function (one-to-one, first match wins).
fn group_one_by<T: Clone, F: Fn(&T) -> i32>(source: &HashMap<i32, T>, key_fn: F) -> HashMap<i32, T> {
    let mut map: HashMap<i32, T> = HashMap::new();
    for value in source.values() {
        map.entry(key_fn(value)).or_insert_with(|| value.clone());
    }
    map
}

// ============================================================================
// Row Traits
// ============================================================================

trait HasId {
    fn id(&self) -> i32;
}

trait HasFk {
    fn fk(&self) -> i32;
}

macro_rules! impl_has_id {
    ($($t:ty),* $(,)?) => {
        $(impl HasId for $t { fn id(&self) -> i32 { self.ID } })*
    };
}

impl_has_id!(
    SpellNameRow, SpellRow, SpellCastTimesRow, SpellDurationRow, SpellRangeRow,
    SpellRadiusRow, SpellCategoryRow, SpellDescriptionVariablesRow, DifficultyRow,
    ManifestInterfaceDataRow, ChrSpecializationRow, ChrClassesRow, TraitNodeRow,
    TraitNodeEntryRow, TraitDefinitionRow, TraitTreeLoadoutRow, TraitSubTreeRow,
    TraitCurrencyRow, TraitCostRow, TraitCondRow, UiTextureAtlasElementRow,
    // Item tables
    ItemRow, ItemSparseRow, ItemEffectRow, ItemSetRow, ItemClassRow, ItemSubClassRow,
    ItemAppearanceRow, JournalEncounterRow, JournalInstanceRow,
    // Global tables
    GlobalColorRow, GlobalStringsRow,
);

macro_rules! impl_has_fk {
    ($t:ty, $field:ident) => {
        impl HasFk for $t { fn fk(&self) -> i32 { self.$field } }
    };
}

// Spell tables indexed by SpellID
impl_has_fk!(SpellMiscRow, SpellID);
impl_has_fk!(SpellEffectRow, SpellID);
impl_has_fk!(SpellPowerRow, SpellID);
impl_has_fk!(SpellCooldownsRow, SpellID);
impl_has_fk!(SpellCategoriesRow, SpellID);
impl_has_fk!(SpellClassOptionsRow, SpellID);
impl_has_fk!(SpellAuraRestrictionsRow, SpellID);
impl_has_fk!(SpellInterruptsRow, SpellID);
impl_has_fk!(SpellEmpowerRow, SpellID);
impl_has_fk!(SpellTargetRestrictionsRow, SpellID);
impl_has_fk!(SpellLevelsRow, SpellID);
impl_has_fk!(SpellLearnSpellRow, SpellID);
impl_has_fk!(SpellReplacementRow, SpellID);
impl_has_fk!(SpellShapeshiftRow, SpellID);
impl_has_fk!(SpellTotemsRow, SpellID);
impl_has_fk!(SpellXDescriptionVariablesRow, SpellID);
impl_has_fk!(SpellAuraOptionsRow, SpellID);
impl_has_fk!(SpellEmpowerStageRow, SpellEmpowerID);

// Character tables
impl_has_fk!(SpecializationSpellsRow, SpecID);

// Talent tables
impl_has_fk!(TraitTreeLoadoutEntryRow, TraitTreeLoadoutID);
impl_has_fk!(TraitEdgeRow, LeftTraitNodeID);
impl_has_fk!(TraitNodeXTraitNodeEntryRow, TraitNodeID);
impl_has_fk!(TraitTreeXTraitCurrencyRow, TraitTreeID);
impl_has_fk!(TraitCurrencySourceRow, TraitCurrencyID);
impl_has_fk!(TraitNodeGroupXTraitNodeRow, TraitNodeID);
impl_has_fk!(TraitNodeGroupXTraitCostRow, TraitNodeGroupID);
impl_has_fk!(TraitNodeGroupXTraitCondRow, TraitNodeGroupID);
impl_has_fk!(TraitNodeXTraitCondRow, TraitNodeID);
impl_has_fk!(SpecSetMemberRow, SpecSet);

// Item tables
impl_has_fk!(ItemXItemEffectRow, ItemID);
impl_has_fk!(ItemSetSpellRow, ItemSetID);
impl_has_fk!(ItemModifiedAppearanceRow, ItemID);
impl_has_fk!(JournalEncounterItemRow, ItemID);
