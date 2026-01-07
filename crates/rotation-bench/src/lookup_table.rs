//! Lookup table implementation for rotation evaluation
//!
//! Pre-computes the entire decision space into a flat array.
//! O(1) lookup but requires discretization of continuous values.

use crate::{Action, SpellId, AuraId, GameState};

/// Discretized state for lookup table
#[derive(Clone, Copy, Debug)]
pub struct DiscreteState {
    /// Focus level (0-4: 0-24, 25-49, 50-74, 75-99, 100+)
    pub focus_level: u8,
    /// Barbed shot charges (0-2)
    pub barbed_charges: u8,
    /// Frenzy remaining (0: none, 1: <2s, 2: 2s+)
    pub frenzy_level: u8,
    /// Boolean flags packed into a byte
    pub flags: u8,
}

impl DiscreteState {
    // Flag bits
    const BESTIAL_WRATH_READY: u8 = 1 << 0;
    const KILL_COMMAND_READY: u8 = 1 << 1;
    const DIRE_BEAST_READY: u8 = 1 << 2;
    const FRENZY_ACTIVE: u8 = 1 << 3;

    /// Discretize continuous game state
    #[inline]
    pub fn from_game_state(state: &GameState) -> Self {
        let focus_level = match state.focus as u32 {
            0..=24 => 0,
            25..=49 => 1,
            50..=74 => 2,
            75..=99 => 3,
            _ => 4,
        };

        let barbed_charges = state.charge_count(SpellId::BARBED_SHOT).min(2);

        let frenzy_remaining = state.aura_remaining(AuraId::FRENZY);
        let frenzy_level = if frenzy_remaining <= 0.0 {
            0
        } else if frenzy_remaining <= 2.0 {
            1
        } else {
            2
        };

        let mut flags = 0u8;
        if state.cooldown_ready(SpellId::BESTIAL_WRATH) {
            flags |= Self::BESTIAL_WRATH_READY;
        }
        if state.cooldown_ready(SpellId::KILL_COMMAND) {
            flags |= Self::KILL_COMMAND_READY;
        }
        if state.cooldown_ready(SpellId::DIRE_BEAST) {
            flags |= Self::DIRE_BEAST_READY;
        }
        if state.aura_active(AuraId::FRENZY) {
            flags |= Self::FRENZY_ACTIVE;
        }

        Self {
            focus_level,
            barbed_charges,
            frenzy_level,
            flags,
        }
    }

    /// Convert to flat index
    /// Dimensions: focus(5) * charges(3) * frenzy(3) * flags(16) = 720 entries
    #[inline]
    pub fn to_index(&self) -> usize {
        let mut idx = 0usize;
        idx = idx * 5 + self.focus_level as usize;
        idx = idx * 3 + self.barbed_charges as usize;
        idx = idx * 3 + self.frenzy_level as usize;
        idx = idx * 16 + self.flags as usize;
        idx
    }

    /// Total number of entries
    pub const TABLE_SIZE: usize = 5 * 3 * 3 * 16; // 720

    /// Evaluate what action should be taken for this discrete state
    fn evaluate_action(&self) -> Action {
        // Bestial Wrath
        if self.flags & Self::BESTIAL_WRATH_READY != 0 {
            return Action::Cast(SpellId::BESTIAL_WRATH);
        }

        // Kill Command with focus
        if self.flags & Self::KILL_COMMAND_READY != 0 && self.focus_level >= 1 {
            return Action::Cast(SpellId::KILL_COMMAND);
        }

        // Barbed Shot to maintain Frenzy
        if self.barbed_charges >= 1 {
            let frenzy_low = self.frenzy_level <= 1;
            let no_frenzy = self.flags & Self::FRENZY_ACTIVE == 0;
            if frenzy_low || no_frenzy {
                return Action::Cast(SpellId::BARBED_SHOT);
            }
        }

        // Barbed Shot at 2 charges
        if self.barbed_charges >= 2 {
            return Action::Cast(SpellId::BARBED_SHOT);
        }

        // Dire Beast
        if self.flags & Self::DIRE_BEAST_READY != 0 {
            return Action::Cast(SpellId::DIRE_BEAST);
        }

        // Cobra Shot filler
        if self.focus_level >= 2 {
            return Action::Cast(SpellId::COBRA_SHOT);
        }

        Action::WaitGcd
    }
}

/// Pre-computed lookup table
pub struct LookupTable {
    /// Flat array of actions indexed by discrete state
    table: Vec<Action>,
}

impl LookupTable {
    /// Build lookup table for BM Hunter
    pub fn bm_hunter() -> Self {
        let mut table = vec![Action::None; DiscreteState::TABLE_SIZE];

        // Enumerate all possible discrete states
        for focus_level in 0..5u8 {
            for barbed_charges in 0..3u8 {
                for frenzy_level in 0..3u8 {
                    for flags in 0..16u8 {
                        let state = DiscreteState {
                            focus_level,
                            barbed_charges,
                            frenzy_level,
                            flags,
                        };
                        let idx = state.to_index();
                        table[idx] = state.evaluate_action();
                    }
                }
            }
        }

        Self { table }
    }

    /// O(1) lookup
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        let discrete = DiscreteState::from_game_state(state);
        let idx = discrete.to_index();
        self.table[idx]
    }

    /// Get table size in bytes
    pub fn size_bytes(&self) -> usize {
        self.table.len() * std::mem::size_of::<Action>()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lookup_table() {
        let lut = LookupTable::bm_hunter();
        let state = GameState::new();
        let action = lut.evaluate(&state);
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }

    #[test]
    fn test_table_size() {
        let lut = LookupTable::bm_hunter();
        println!("Lookup table size: {} bytes", lut.size_bytes());
        // Should be small enough to fit in L1 cache
        assert!(lut.size_bytes() < 32 * 1024);
    }

    #[test]
    fn test_discrete_state_roundtrip() {
        // Test that discretization is consistent
        for i in 0..DiscreteState::TABLE_SIZE {
            let focus_level = ((i / (3 * 3 * 16)) % 5) as u8;
            let barbed_charges = ((i / (3 * 16)) % 3) as u8;
            let frenzy_level = ((i / 16) % 3) as u8;
            let flags = (i % 16) as u8;

            let state = DiscreteState {
                focus_level,
                barbed_charges,
                frenzy_level,
                flags,
            };

            assert_eq!(state.to_index(), i);
        }
    }
}
