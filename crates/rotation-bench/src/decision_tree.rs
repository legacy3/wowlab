//! Decision tree implementation for rotation evaluation
//!
//! Pre-evaluates conditions into a bitset, then traverses a compact tree.

use bitvec::prelude::*;
use crate::{Action, SpellId, AuraId, GameState};

/// Condition types for pre-evaluation
#[derive(Clone, Copy, Debug)]
pub enum ConditionType {
    SpellReady(SpellId),
    SpellChargesGe(SpellId, u8),
    AuraActive(AuraId),
    AuraRemainingLe(AuraId, u16), // centiseconds for compact storage
    FocusGe(u8),
}

/// Compact decision tree node (8 bytes)
#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct TreeNode {
    /// Condition index (0xFFFF = leaf)
    condition_idx: u16,
    /// True branch index (or spell_id if leaf)
    true_branch: u16,
    /// False branch index
    false_branch: u16,
    /// Flags
    flags: u16,
}

impl TreeNode {
    const LEAF_FLAG: u16 = 0x8000;

    fn branch(condition_idx: u16, true_branch: u16, false_branch: u16) -> Self {
        Self {
            condition_idx,
            true_branch,
            false_branch,
            flags: 0,
        }
    }

    fn leaf(action: Action) -> Self {
        let (spell_id, flags) = match action {
            Action::Cast(SpellId(id)) => (id, Self::LEAF_FLAG),
            Action::WaitGcd => (0xFFFE, Self::LEAF_FLAG),
            Action::Wait(cs) => (cs, Self::LEAF_FLAG | 0x4000),
            Action::None => (0xFFFF, Self::LEAF_FLAG),
        };
        Self {
            condition_idx: 0xFFFF,
            true_branch: spell_id,
            false_branch: 0,
            flags,
        }
    }

    #[inline]
    fn is_leaf(&self) -> bool {
        self.flags & Self::LEAF_FLAG != 0
    }

    #[inline]
    fn get_action(&self) -> Action {
        if self.true_branch == 0xFFFE {
            Action::WaitGcd
        } else if self.true_branch == 0xFFFF {
            Action::None
        } else if self.flags & 0x4000 != 0 {
            Action::Wait(self.true_branch)
        } else {
            Action::Cast(SpellId(self.true_branch))
        }
    }
}

/// Decision tree with pre-evaluated conditions
pub struct DecisionTree {
    nodes: Vec<TreeNode>,
    conditions: Vec<ConditionType>,
}

impl DecisionTree {
    /// Create BM Hunter decision tree
    pub fn bm_hunter() -> Self {
        // Conditions (indexed)
        let conditions = vec![
            ConditionType::SpellReady(SpellId::BESTIAL_WRATH),    // 0
            ConditionType::SpellReady(SpellId::KILL_COMMAND),     // 1
            ConditionType::FocusGe(30),                           // 2
            ConditionType::SpellChargesGe(SpellId::BARBED_SHOT, 1), // 3
            ConditionType::AuraRemainingLe(AuraId::FRENZY, 200),  // 4 (2.0 seconds)
            ConditionType::AuraActive(AuraId::FRENZY),            // 5
            ConditionType::SpellChargesGe(SpellId::BARBED_SHOT, 2), // 6
            ConditionType::SpellReady(SpellId::DIRE_BEAST),       // 7
            ConditionType::FocusGe(50),                           // 8
        ];

        // Build tree structure
        // Node indices:
        // 0: bestial_wrath check
        // 1: leaf(bestial_wrath)
        // 2: kill_command_ready check
        // 3: focus >= 30 check
        // 4: leaf(kill_command)
        // 5: barbed_charges >= 1 check
        // 6: frenzy_remaining <= 2 check
        // 7: leaf(barbed_shot)
        // 8: frenzy_active check (negated)
        // 9: barbed_charges >= 2 check
        // 10: leaf(barbed_shot)
        // 11: dire_beast check
        // 12: leaf(dire_beast)
        // 13: focus >= 50 check
        // 14: leaf(cobra_shot)
        // 15: leaf(wait_gcd)

        let nodes = vec![
            TreeNode::branch(0, 1, 2),   // 0: check bestial_wrath_ready
            TreeNode::leaf(Action::Cast(SpellId::BESTIAL_WRATH)), // 1
            TreeNode::branch(1, 3, 5),   // 2: check kill_command_ready
            TreeNode::branch(2, 4, 5),   // 3: check focus >= 30
            TreeNode::leaf(Action::Cast(SpellId::KILL_COMMAND)), // 4
            TreeNode::branch(3, 6, 9),   // 5: check barbed_charges >= 1
            TreeNode::branch(4, 7, 8),   // 6: check frenzy_remaining <= 2
            TreeNode::leaf(Action::Cast(SpellId::BARBED_SHOT)), // 7
            TreeNode::branch(5, 9, 7),   // 8: check frenzy_active (if NOT active, cast)
            TreeNode::branch(6, 10, 11), // 9: check barbed_charges >= 2
            TreeNode::leaf(Action::Cast(SpellId::BARBED_SHOT)), // 10
            TreeNode::branch(7, 12, 13), // 11: check dire_beast_ready
            TreeNode::leaf(Action::Cast(SpellId::DIRE_BEAST)), // 12
            TreeNode::branch(8, 14, 15), // 13: check focus >= 50
            TreeNode::leaf(Action::Cast(SpellId::COBRA_SHOT)), // 14
            TreeNode::leaf(Action::WaitGcd), // 15
        ];

        Self { nodes, conditions }
    }

    /// Pre-evaluate all conditions into a bitset
    #[inline]
    fn evaluate_conditions(&self, state: &GameState) -> BitVec {
        let mut results = bitvec![0; self.conditions.len()];

        for (i, cond) in self.conditions.iter().enumerate() {
            let result = match cond {
                ConditionType::SpellReady(spell) => state.cooldown_ready(*spell),
                ConditionType::SpellChargesGe(spell, val) => state.charge_count(*spell) >= *val,
                ConditionType::AuraActive(aura) => state.aura_active(*aura),
                ConditionType::AuraRemainingLe(aura, cs) => {
                    state.aura_remaining(*aura) <= (*cs as f32 / 100.0)
                }
                ConditionType::FocusGe(val) => state.focus >= *val as f32,
            };
            results.set(i, result);
        }

        results
    }

    /// Traverse the tree using pre-evaluated conditions
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        let conditions = self.evaluate_conditions(state);
        self.traverse(&conditions)
    }

    /// Traverse with pre-computed conditions
    #[inline]
    fn traverse(&self, conditions: &BitVec) -> Action {
        let mut node_idx = 0usize;

        loop {
            let node = &self.nodes[node_idx];

            if node.is_leaf() {
                return node.get_action();
            }

            let cond_result = conditions[node.condition_idx as usize];
            node_idx = if cond_result {
                node.true_branch as usize
            } else {
                node.false_branch as usize
            };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decision_tree() {
        let tree = DecisionTree::bm_hunter();
        let state = GameState::new();
        let action = tree.evaluate(&state);
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }

    #[test]
    fn test_decision_tree_fallback() {
        let tree = DecisionTree::bm_hunter();
        let mut state = GameState::new();
        // Set all cooldowns on CD, no charges, low focus
        state.cooldowns = [15.0; 8];
        state.charges = [0; 8];
        state.focus = 20.0;

        let action = tree.evaluate(&state);
        assert!(matches!(action, Action::WaitGcd));
    }
}
