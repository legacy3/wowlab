//! Flat representation of talent tree data for storage and API responses.

use serde::{Deserialize, Serialize};

/// Complete talent tree for a specialization.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitTreeFlat {
    pub spec_id: i32,
    pub spec_name: String,
    pub class_name: String,
    pub tree_id: i32,
    pub all_node_ids: Vec<i32>,
    pub nodes: Vec<TraitNode>,
    pub edges: Vec<TraitEdge>,
    pub sub_trees: Vec<TraitSubTree>,
    pub point_limits: PointLimits,
}

/// A talent node with position, type, and available choices.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitNode {
    pub id: i32,
    pub pos_x: i32,
    pub pos_y: i32,
    pub max_ranks: i32,
    #[serde(rename = "type")]
    pub node_type: i32,
    pub tree_index: i32,
    pub order_index: i32,
    pub sub_tree_id: i32,
    pub entries: Vec<TraitNodeEntry>,
}

/// A selectable talent within a node.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitNodeEntry {
    pub id: i32,
    pub definition_id: i32,
    pub spell_id: i32,
    pub name: String,
    pub description: String,
    pub icon_file_name: String,
}

/// A directed edge connecting two nodes (prerequisite relationship).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitEdge {
    pub id: i32,
    pub from_node_id: i32,
    pub to_node_id: i32,
    pub visual_style: i32,
}

/// A hero talent subtree (introduced in The War Within).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitSubTree {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub icon_file_name: String,
}

/// Maximum spendable points per tree section.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PointLimits {
    pub class: i32,
    pub spec: i32,
    pub hero: i32,
}

impl Default for PointLimits {
    fn default() -> Self {
        Self {
            class: 31,
            spec: 30,
            hero: 10,
        }
    }
}

/// A decoded talent selection for a single node.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitSelection {
    pub node_id: i32,
    pub selected: bool,
    pub ranks_purchased: i32,
    pub choice_index: Option<u8>,
}

/// A talent tree with user selections applied.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraitTreeWithSelections {
    #[serde(flatten)]
    pub tree: TraitTreeFlat,
    pub selections: Vec<TraitSelection>,
}
