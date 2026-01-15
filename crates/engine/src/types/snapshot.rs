use serde::{Serialize, Deserialize};

bitflags::bitflags! {
    #[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
    #[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
    #[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
    pub struct SnapshotFlags: u32 {
        const ATTACK_POWER = 1 << 0;
        const SPELL_POWER = 1 << 1;
        const CRIT = 1 << 2;
        const HASTE = 1 << 3;
        const VERSATILITY = 1 << 4;
        const MASTERY = 1 << 5;
        const DA_MULTIPLIER = 1 << 6;
        const TA_MULTIPLIER = 1 << 7;
        const PERSISTENT_MULT = 1 << 8;
        const PLAYER_MULT = 1 << 9;

        /// Standard physical DoT: AP + persistent
        const DOT_PHYSICAL = Self::ATTACK_POWER.bits() | Self::PERSISTENT_MULT.bits();
        /// Standard magic DoT: SP + persistent
        const DOT_MAGIC = Self::SPELL_POWER.bits() | Self::PERSISTENT_MULT.bits();
        /// Full snapshot (everything)
        const ALL = Self::ATTACK_POWER.bits()
            | Self::SPELL_POWER.bits()
            | Self::CRIT.bits()
            | Self::HASTE.bits()
            | Self::VERSATILITY.bits()
            | Self::MASTERY.bits()
            | Self::DA_MULTIPLIER.bits()
            | Self::TA_MULTIPLIER.bits()
            | Self::PERSISTENT_MULT.bits()
            | Self::PLAYER_MULT.bits();
    }
}
