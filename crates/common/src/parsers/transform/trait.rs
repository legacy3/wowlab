//! Talent tree transformation - converts raw DBC data into TraitTreeFlat
//!
//! Transforms WoW's trait system tables into a unified talent tree structure.
//! The trait system uses several interconnected tables:
//!
//! - TraitTreeLoadout: Links specs to their talent trees
//! - TraitNode: Individual talent nodes with position and type
//! - TraitNodeEntry: The actual talent choices within a node
//! - TraitDefinition: Spell/ability info for each entry
//! - TraitEdge: Connections between nodes (prerequisites)
//! - TraitSubTree: Hero talent subtrees (TWW feature)
//! - TraitCond: Conditions that restrict node availability by spec

use std::collections::{HashMap, HashSet};

#[cfg(feature = "dbc")]
use super::super::dbc::rows::{TraitNodeGroupXTraitNodeRow, TraitNodeRow, TraitNodeXTraitNodeEntryRow};
#[cfg(feature = "dbc")]
use super::super::dbc::DbcData;
use super::super::errors::TransformError;
use crate::types::data::{PointLimits, TraitEdge, TraitNode, TraitNodeEntry, TraitSubTree, TraitTreeFlat};

/// Target position for hero talent trees after offset calculation.
/// Hero trees are repositioned to appear in a consistent location.
const TARGET_HERO_X: i32 = 7500;
const TARGET_HERO_Y: i32 = 1200;

/// Currency flag indicating class-wide talent points
const CURRENCY_FLAG_CLASS: i32 = 0x4;

/// Currency flag indicating spec-specific talent points
const CURRENCY_FLAG_SPEC: i32 = 0x8;

/// Tree index values for categorizing nodes
const TREE_INDEX_CLASS: i32 = 1;
const TREE_INDEX_SPEC: i32 = 2;
const TREE_INDEX_HERO: i32 = 3;

// Main Transform Function

/// Transform a specialization into its complete talent tree structure.
///
/// The transformation process:
/// 1. Load spec and class metadata
/// 2. Gather all loadouts (class/spec tree + hero trees) for the spec
/// 3. Collect all nodes from all associated trait trees
/// 4. Filter hero subtrees to only those available for this spec
/// 5. Build edges between nodes
/// 6. Reposition hero nodes to a standard location
/// 7. Determine tree index (class/spec/hero) for each node
/// 8. Assemble final node entries with spell/icon info
/// 9. Calculate point limits from currency sources
pub fn transform_trait_tree(dbc: &DbcData, spec_id: i32) -> Result<TraitTreeFlat, TransformError> {
    // Step 1: Load spec and class metadata
    let spec = dbc
        .chr_specialization
        .get(&spec_id)
        .ok_or(TransformError::SpecNotFound { spec_id })?;

    let class_id = spec
        .ClassID
        .ok_or(TransformError::SpecNotFound { spec_id })?;
    let chr_class = dbc
        .chr_classes
        .get(&class_id)
        .ok_or(TransformError::ClassNotFound { class_id })?;

    // Step 2: Get all loadouts for this spec
    // Each spec can have multiple loadouts (one for class/spec tree, one for hero trees)
    let loadouts = dbc
        .trait_tree_loadout_by_spec
        .get(&spec_id)
        .ok_or(TransformError::LoadoutNotFound { spec_id })?;

    let all_tree_ids: Vec<i32> = loadouts
        .iter()
        .map(|l| l.TraitTreeID)
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    // Use min() for deterministic selection since loadouts comes from HashMap iteration
    let tree_id = loadouts.iter().map(|l| l.TraitTreeID).min().unwrap_or(0);

    // Step 3: Build order index map from loadout entries
    // This determines the order nodes are processed when parsing loadout strings
    let order_index_map = build_order_index_map(dbc, loadouts);

    // Step 4: Collect all nodes from all trees for this spec
    let all_tree_nodes: Vec<_> = all_tree_ids
        .iter()
        .flat_map(|&tid| {
            dbc.trait_node_by_tree
                .get(&tid)
                .cloned()
                .unwrap_or_default()
        })
        .collect();

    // Step 5: Build spec set lookup for filtering
    let spec_set_to_specs = build_spec_set_lookup(dbc);

    // Step 6: Filter nodes by spec conditions
    // This removes nodes that are gated for other specs (e.g., Balance shouldn't see
    // Feral-specific talents like "Sudden Ambush" that occupy the same position)
    let tree_nodes: Vec<_> = all_tree_nodes
        .iter()
        .filter(|node| should_include_node_for_spec(dbc, node.ID, spec_id, &spec_set_to_specs))
        .cloned()
        .collect();

    let node_ids: Vec<i32> = tree_nodes.iter().map(|n| n.ID).collect();
    let node_id_set: HashSet<i32> = node_ids.iter().copied().collect();

    // Step 7: Filter subtrees to only those available for this spec
    // Hero talent subtrees are gated by spec-specific conditions
    let valid_sub_tree_ids = get_valid_subtrees_for_spec(dbc, &all_tree_nodes, spec_id);

    let all_sub_tree_ids: Vec<i32> = tree_nodes
        .iter()
        .map(|n| n.TraitSubTreeID)
        .filter(|&id| id > 0)
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    // Step 8: Collect edges, filtering to only edges within this tree
    let all_edges = collect_edges(dbc, &node_ids, &node_id_set);

    // Step 9: Calculate position offsets for hero trees
    // Hero trees are repositioned to a standard location for consistent display
    let hero_tree_offsets = calculate_hero_tree_offsets(&tree_nodes, &all_sub_tree_ids);

    // Step 10: Build node group memberships and tree index lookup
    let node_group_memberships = collect_node_group_memberships(dbc, &tree_nodes);
    let group_ids: HashSet<i32> = node_group_memberships
        .iter()
        .map(|m| m.TraitNodeGroupID)
        .collect();
    let group_to_tree_index = build_group_tree_index_map(dbc, &group_ids);

    // Step 11: Build node entries mapping with sorted selections
    let node_x_entries = build_node_entries_map(dbc, &tree_nodes);

    // Step 12: Assemble nodes
    // Skip Type=3 nodes (SubTreeSelection) as they're UI-only for choosing hero specs
    let mut nodes: Vec<TraitNode> = tree_nodes
        .iter()
        .filter(|node| node.Type != 3)
        .filter_map(|node| {
            build_talent_node(
                dbc,
                node,
                &node_x_entries,
                &hero_tree_offsets,
                &node_group_memberships,
                &group_to_tree_index,
                &order_index_map,
            )
        })
        .collect();
    nodes.sort_by_key(|n| n.id);

    // Step 13: Convert edges to output format
    let mut edges: Vec<TraitEdge> = all_edges
        .iter()
        .map(|e| TraitEdge {
            id: e.ID,
            from_node_id: e.LeftTraitNodeID,
            to_node_id: e.RightTraitNodeID,
            visual_style: e.VisualStyle,
        })
        .collect();
    edges.sort_by_key(|e| e.id);

    // Step 14: Build subtrees (only those valid for this spec)
    let mut sub_trees = build_subtrees(dbc, &valid_sub_tree_ids, &nodes);
    sub_trees.sort_by_key(|s| s.id);

    // Step 15: Calculate point limits from currency sources
    let point_limits = calculate_point_limits(dbc, &all_tree_ids);

    // All node IDs sorted for loadout string parsing
    let mut all_node_ids: Vec<i32> = tree_nodes.iter().map(|n| n.ID).collect();
    all_node_ids.sort();

    Ok(TraitTreeFlat {
        spec_id,
        spec_name: spec.Name_lang.clone().unwrap_or_default(),
        class_name: chr_class.Name_lang.clone().unwrap_or_default(),
        tree_id,
        all_node_ids,
        nodes,
        edges,
        sub_trees,
        point_limits,
    })
}

// Helper Functions - Data Collection

/// Build a map from node ID to order index from loadout entries.
fn build_order_index_map(
    dbc: &DbcData,
    loadouts: &[super::super::dbc::TraitTreeLoadoutRow],
) -> HashMap<i32, i32> {
    let mut entries: Vec<_> = loadouts
        .iter()
        .flat_map(|loadout| {
            dbc.trait_tree_loadout_entry
                .get(&loadout.ID)
                .cloned()
                .unwrap_or_default()
        })
        .collect();
    entries.sort_by_key(|e| e.OrderIndex);

    entries
        .iter()
        .map(|e| (e.SelectedTraitNodeID, e.OrderIndex))
        .collect()
}

/// Collect all edges between nodes in the given node set.
fn collect_edges(
    dbc: &DbcData,
    node_ids: &[i32],
    node_id_set: &HashSet<i32>,
) -> Vec<super::super::dbc::TraitEdgeRow> {
    node_ids
        .iter()
        .flat_map(|&node_id| dbc.trait_edge.get(&node_id).cloned().unwrap_or_default())
        .filter(|e| {
            node_id_set.contains(&e.LeftTraitNodeID) && node_id_set.contains(&e.RightTraitNodeID)
        })
        .collect()
}

/// Collect node group memberships for all nodes.
fn collect_node_group_memberships(
    dbc: &DbcData,
    tree_nodes: &[TraitNodeRow],
) -> Vec<TraitNodeGroupXTraitNodeRow> {
    tree_nodes
        .iter()
        .flat_map(|n| {
            dbc.trait_node_group_x_trait_node
                .get(&n.ID)
                .cloned()
                .unwrap_or_default()
        })
        .collect()
}

/// Build a map from group ID to tree index based on currency flags.
/// Currency flags determine whether points come from class or spec pool.
fn build_group_tree_index_map(dbc: &DbcData, group_ids: &HashSet<i32>) -> HashMap<i32, i32> {
    let mut map = HashMap::new();

    for &group_id in group_ids {
        let Some(conds) = dbc.trait_cond_by_node_group.get(&group_id) else {
            continue;
        };

        for cond in conds {
            if cond.TraitCurrencyID <= 0 {
                continue;
            }

            if let Some(currency) = dbc.trait_currency.get(&cond.TraitCurrencyID) {
                if currency.Flags == CURRENCY_FLAG_CLASS {
                    map.insert(group_id, TREE_INDEX_CLASS);
                } else if currency.Flags == CURRENCY_FLAG_SPEC {
                    map.insert(group_id, TREE_INDEX_SPEC);
                }
            }
        }
    }

    map
}

/// Build a map from node ID to sorted entry references.
/// Entries are sorted by their selection index for choice nodes.
fn build_node_entries_map(
    dbc: &DbcData,
    tree_nodes: &[TraitNodeRow],
) -> HashMap<i32, Vec<TraitNodeXTraitNodeEntryRow>> {
    tree_nodes
        .iter()
        .map(|n| {
            let entries = dbc
                .trait_node_x_trait_node_entry
                .get(&n.ID)
                .cloned()
                .unwrap_or_default();

            let mut sorted = entries;
            sorted.sort_by(|a, b| match (a.Index >= 0, b.Index >= 0) {
                (true, true) => a.Index.cmp(&b.Index),
                _ => b.TraitNodeEntryID.cmp(&a.TraitNodeEntryID),
            });

            (n.ID, sorted)
        })
        .collect()
}

// Helper Functions - Node Building

/// Build a TraitNode from raw DBC data.
fn build_talent_node(
    dbc: &DbcData,
    node: &TraitNodeRow,
    node_x_entries: &HashMap<i32, Vec<TraitNodeXTraitNodeEntryRow>>,
    hero_tree_offsets: &HashMap<i32, (i32, i32)>,
    node_group_memberships: &[TraitNodeGroupXTraitNodeRow],
    group_to_tree_index: &HashMap<i32, i32>,
    order_index_map: &HashMap<i32, i32>,
) -> Option<TraitNode> {
    let x_entries = node_x_entries.get(&node.ID)?;

    let mut max_ranks = 1;
    let mut entries: Vec<TraitNodeEntry> = Vec::new();

    for x_entry in x_entries {
        let entry = dbc.trait_node_entry.get(&x_entry.TraitNodeEntryID)?;
        let definition = dbc.trait_definition.get(&entry.TraitDefinitionID)?;

        if entries.is_empty() {
            max_ranks = entry.MaxRanks;
        }

        let icon_file_name = get_icon_file_name(dbc, definition);
        let name = get_talent_name(dbc, definition);
        let description = get_talent_description(dbc, definition);

        entries.push(TraitNodeEntry {
            id: entry.ID,
            definition_id: definition.ID,
            spell_id: definition.SpellID,
            name,
            description,
            icon_file_name,
        });
    }

    if entries.is_empty() {
        return None;
    }

    // Apply hero tree position offset
    let (pos_x, pos_y) = apply_hero_offset(node, hero_tree_offsets);

    // Determine tree index based on subtree or group membership
    let tree_index = determine_tree_index(node, node_group_memberships, group_to_tree_index);

    Some(TraitNode {
        id: node.ID,
        pos_x,
        pos_y,
        max_ranks,
        node_type: node.Type,
        tree_index,
        order_index: order_index_map.get(&node.ID).copied().unwrap_or(-1),
        sub_tree_id: node.TraitSubTreeID,
        entries,
    })
}

/// Apply hero tree offset to node position.
fn apply_hero_offset(node: &TraitNodeRow, offsets: &HashMap<i32, (i32, i32)>) -> (i32, i32) {
    if node.TraitSubTreeID > 0 {
        if let Some(&(dx, dy)) = offsets.get(&node.TraitSubTreeID) {
            return (node.PosX + dx, node.PosY + dy);
        }
    }
    (node.PosX, node.PosY)
}

/// Determine tree index (class/spec/hero) for a node.
fn determine_tree_index(
    node: &TraitNodeRow,
    memberships: &[TraitNodeGroupXTraitNodeRow],
    group_to_tree_index: &HashMap<i32, i32>,
) -> i32 {
    if node.TraitSubTreeID > 0 {
        return TREE_INDEX_HERO;
    }

    let group_id = memberships
        .iter()
        .find(|m| m.TraitNodeID == node.ID)
        .map(|m| m.TraitNodeGroupID);

    group_id
        .and_then(|g| group_to_tree_index.get(&g).copied())
        .unwrap_or(TREE_INDEX_SPEC)
}

/// Get talent name from definition override or spell name.
fn get_talent_name(dbc: &DbcData, definition: &super::super::dbc::TraitDefinitionRow) -> String {
    if let Some(name) = &definition.OverrideName_lang {
        return name.clone();
    }

    if definition.SpellID > 0 {
        if let Some(spell) = dbc.spell_name.get(&definition.SpellID) {
            if let Some(name) = &spell.Name_lang {
                return name.clone();
            }
        }
        return format!("Spell {}", definition.SpellID);
    }

    "Unknown Talent".to_string()
}

/// Get talent description from definition override or spell description.
fn get_talent_description(dbc: &DbcData, definition: &super::super::dbc::TraitDefinitionRow) -> String {
    if let Some(desc) = &definition.OverrideDescription_lang {
        return desc.clone();
    }

    if definition.SpellID > 0 {
        if let Some(spell) = dbc.spell.get(&definition.SpellID) {
            if let Some(desc) = &spell.Description_lang {
                return desc.clone();
            }
        }
    }

    String::new()
}

// Helper Functions - Subtrees

/// Build subtree output structures for valid subtrees.
fn build_subtrees(
    dbc: &DbcData,
    valid_sub_tree_ids: &HashSet<i32>,
    nodes: &[TraitNode],
) -> Vec<TraitSubTree> {
    valid_sub_tree_ids
        .iter()
        .filter_map(|&sub_tree_id| {
            let sub_tree = dbc.trait_sub_tree.get(&sub_tree_id)?;

            let icon_file_name = dbc
                .ui_texture_atlas_element
                .get(&sub_tree.UiTextureAtlasElementID)
                .map(|e| e.Name.clone())
                .unwrap_or_else(|| derive_sub_tree_icon(nodes, sub_tree_id));

            Some(TraitSubTree {
                id: sub_tree_id,
                name: sub_tree.Name_lang.clone().unwrap_or_default(),
                description: sub_tree.Description_lang.clone().unwrap_or_default(),
                icon_file_name,
            })
        })
        .collect()
}

// Helper Functions - Point Limits

/// Calculate point limits for class, spec, and hero trees.
fn calculate_point_limits(dbc: &DbcData, all_tree_ids: &[i32]) -> PointLimits {
    let tree_currencies: Vec<_> = all_tree_ids
        .iter()
        .flat_map(|&tid| {
            dbc.trait_tree_x_trait_currency
                .get(&tid)
                .cloned()
                .unwrap_or_default()
        })
        .collect();

    let currency_ids: HashSet<i32> = tree_currencies
        .iter()
        .map(|tc| tc.TraitCurrencyID)
        .collect();

    let currency_totals: HashMap<i32, i32> = currency_ids
        .iter()
        .map(|&currency_id| {
            let total = dbc
                .trait_currency_source
                .get(&currency_id)
                .map(|sources| sources.iter().map(|s| s.Amount).sum())
                .unwrap_or(0);
            (currency_id, total)
        })
        .collect();

    let mut class_limit = 0;
    let mut spec_limit = 0;
    let mut hero_limit = 0;

    for tc in tree_currencies {
        let Some(currency) = dbc.trait_currency.get(&tc.TraitCurrencyID) else {
            continue;
        };
        let total = currency_totals
            .get(&tc.TraitCurrencyID)
            .copied()
            .unwrap_or(0);

        if currency.Flags & CURRENCY_FLAG_CLASS != 0 {
            class_limit += total;
        } else if currency.Flags & CURRENCY_FLAG_SPEC != 0 {
            spec_limit += total;
        } else if currency.Flags == 0 {
            hero_limit = hero_limit.max(total);
        }
    }

    PointLimits {
        class: class_limit,
        spec: spec_limit,
        hero: hero_limit,
    }
}

// Helper Functions - Hero Tree Positioning

const DEFAULT_ICON: &str = "inv_misc_questionmark";

/// Calculate position offsets for hero subtrees.
/// Each subtree is repositioned so its top-left corner aligns with the target position.
fn calculate_hero_tree_offsets(
    nodes: &[TraitNodeRow],
    sub_tree_ids: &[i32],
) -> HashMap<i32, (i32, i32)> {
    let mut offsets = HashMap::new();

    for &sub_tree_id in sub_tree_ids {
        let hero_nodes: Vec<_> = nodes
            .iter()
            .filter(|n| n.TraitSubTreeID == sub_tree_id)
            .collect();

        if hero_nodes.is_empty() {
            continue;
        }

        let min_x = hero_nodes.iter().map(|n| n.PosX).min().unwrap_or(0);
        let min_y = hero_nodes.iter().map(|n| n.PosY).min().unwrap_or(0);

        offsets.insert(sub_tree_id, (TARGET_HERO_X - min_x, TARGET_HERO_Y - min_y));
    }

    offsets
}

// Helper Functions - Icons

/// Get icon file name from definition override or spell data.
fn get_icon_file_name(dbc: &DbcData, definition: &super::super::dbc::TraitDefinitionRow) -> String {
    let icon_file_data_id = if definition.OverrideIcon > 0 {
        definition.OverrideIcon
    } else if definition.SpellID > 0 {
        dbc.spell_misc
            .get(&definition.SpellID)
            .map(|m| m.SpellIconFileDataID)
            .unwrap_or(0)
    } else {
        0
    };

    if icon_file_data_id == 0 {
        return DEFAULT_ICON.to_string();
    }

    dbc.manifest_interface_data
        .get(&icon_file_data_id)
        .map(|m| m.FileName.to_lowercase().replace(".blp", ""))
        .unwrap_or_else(|| DEFAULT_ICON.to_string())
}

/// Derive subtree icon from the first node entry with an icon.
fn derive_sub_tree_icon(nodes: &[TraitNode], sub_tree_id: i32) -> String {
    nodes
        .iter()
        .filter(|n| n.sub_tree_id == sub_tree_id)
        .flat_map(|n| &n.entries)
        .find(|e| !e.icon_file_name.is_empty())
        .map(|e| e.icon_file_name.clone())
        .unwrap_or_else(|| DEFAULT_ICON.to_string())
}

// Helper Functions - Subtree Filtering

/// Condition type for spec-based restrictions
const COND_TYPE_SPEC: i32 = 1;

/// Node type for subtree selection nodes
const NODE_TYPE_SUBTREE_SELECTION: i32 = 3;

/// Get hero subtrees available for a specific spec.
///
/// Hero talent subtrees are gated by spec conditions. To determine which subtrees
/// a spec can access:
///
/// 1. Find Type=3 (SubTreeSelection) nodes in the tree
/// 2. Check each node's conditions via TraitNodeXTraitCond -> TraitCond
/// 3. For CondType=1 (spec restriction), check if the spec is in the SpecSetMember table
/// 4. If the node is available, collect the TraitSubTreeID from its entries
fn get_valid_subtrees_for_spec(
    dbc: &DbcData,
    tree_nodes: &[TraitNodeRow],
    spec_id: i32,
) -> HashSet<i32> {
    let spec_set_to_specs = build_spec_set_lookup(dbc);
    let mut valid_subtrees = HashSet::new();

    let selection_nodes = tree_nodes
        .iter()
        .filter(|n| n.Type == NODE_TYPE_SUBTREE_SELECTION);

    for node in selection_nodes {
        if !is_node_available_for_spec(dbc, node.ID, spec_id, &spec_set_to_specs) {
            continue;
        }

        let entries = dbc
            .trait_node_x_trait_node_entry
            .get(&node.ID)
            .cloned()
            .unwrap_or_default();

        for x_entry in entries {
            if let Some(entry) = dbc.trait_node_entry.get(&x_entry.TraitNodeEntryID) {
                if entry.TraitSubTreeID > 0 {
                    valid_subtrees.insert(entry.TraitSubTreeID);
                }
            }
        }
    }

    valid_subtrees
}

/// Build a lookup from SpecSetID to list of spec IDs in that set.
fn build_spec_set_lookup(dbc: &DbcData) -> HashMap<i32, Vec<i32>> {
    let mut map: HashMap<i32, Vec<i32>> = HashMap::new();
    for members in dbc.spec_set_member.values() {
        for member in members {
            map.entry(member.SpecSet)
                .or_default()
                .push(member.ChrSpecializationID);
        }
    }
    map
}

/// Check if a node is available for a given spec based on its conditions.
/// Used for SubTreeSelection nodes which are expected to have spec conditions.
fn is_node_available_for_spec(
    dbc: &DbcData,
    node_id: i32,
    spec_id: i32,
    spec_set_to_specs: &HashMap<i32, Vec<i32>>,
) -> bool {
    let node_conds = dbc
        .trait_node_x_trait_cond
        .get(&node_id)
        .cloned()
        .unwrap_or_default();

    for node_cond in node_conds {
        let Some(cond) = dbc.trait_cond.get(&node_cond.TraitCondID) else {
            continue;
        };

        if cond.CondType != COND_TYPE_SPEC || cond.SpecSetID <= 0 {
            continue;
        }

        if let Some(specs) = spec_set_to_specs.get(&cond.SpecSetID) {
            if specs.contains(&spec_id) {
                return true;
            }
        }
    }

    false
}

/// Check if a talent node should be included for a given spec.
///
/// Spec-conditional filtering happens at TWO levels:
/// 1. Direct node conditions via `TraitNodeXTraitCond` (rare)
/// 2. Group conditions via `TraitNodeGroupXTraitCond` (common for spec-conditional nodes)
///
/// For spec-conditional nodes (e.g., Balance sees "Solstice" while Feral sees "Merciless Claws"
/// at the same position), the spec restriction is on a TraitNodeGroup, not the node itself.
///
/// Logic:
/// - Check direct node conditions first
/// - Check all group memberships for spec conditions
/// - If ANY spec condition exists (node or group), the spec must be in an allowed set
fn should_include_node_for_spec(
    dbc: &DbcData,
    node_id: i32,
    spec_id: i32,
    spec_set_to_specs: &HashMap<i32, Vec<i32>>,
) -> bool {
    let mut has_spec_condition = false;
    let mut spec_allowed = false;

    // Check direct node conditions (TraitNodeXTraitCond)
    let node_conds = dbc
        .trait_node_x_trait_cond
        .get(&node_id)
        .cloned()
        .unwrap_or_default();

    for node_cond in &node_conds {
        let Some(cond) = dbc.trait_cond.get(&node_cond.TraitCondID) else {
            continue;
        };

        if cond.CondType != COND_TYPE_SPEC || cond.SpecSetID <= 0 {
            continue;
        }

        has_spec_condition = true;

        if let Some(specs) = spec_set_to_specs.get(&cond.SpecSetID) {
            if specs.contains(&spec_id) {
                spec_allowed = true;
            }
        }
    }

    // Check group conditions (TraitNodeGroupXTraitCond -> TraitCond)
    // This is the primary mechanism for spec-conditional nodes
    let node_groups = dbc
        .trait_node_group_x_trait_node
        .get(&node_id)
        .cloned()
        .unwrap_or_default();

    for node_group in &node_groups {
        // Get condition references for this group
        let group_cond_refs = dbc
            .trait_node_group_x_trait_cond
            .get(&node_group.TraitNodeGroupID)
            .cloned()
            .unwrap_or_default();

        for cond_ref in &group_cond_refs {
            // Look up the actual condition
            let Some(cond) = dbc.trait_cond.get(&cond_ref.TraitCondID) else {
                continue;
            };

            if cond.CondType != COND_TYPE_SPEC || cond.SpecSetID <= 0 {
                continue;
            }

            has_spec_condition = true;

            if let Some(specs) = spec_set_to_specs.get(&cond.SpecSetID) {
                if specs.contains(&spec_id) {
                    spec_allowed = true;
                }
            }
        }
    }

    // No spec conditions = available to all specs
    // Has spec conditions = only if this spec is allowed
    !has_spec_condition || spec_allowed
}
