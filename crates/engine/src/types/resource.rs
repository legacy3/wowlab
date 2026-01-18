use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum ResourceType {
    Mana = 0,
    Rage = 1,
    Focus = 2,
    Energy = 3,
    ComboPoints = 4,
    Runes = 5,
    RunicPower = 6,
    SoulShards = 7,
    LunarPower = 8,
    HolyPower = 9,
    Maelstrom = 10,
    Chi = 11,
    Insanity = 12,
    ArcaneCharges = 13,
    Fury = 14,
    Pain = 15,
    Essence = 16,
}

impl ResourceType {
    pub const COUNT: usize = 17;

    /// Maximum value for this resource (before gear/talents)
    pub const fn base_max(self) -> u32 {
        match self {
            Self::Mana => 50000,
            Self::Rage | Self::Focus | Self::Energy => 100,
            Self::ComboPoints | Self::SoulShards | Self::HolyPower | Self::Chi | Self::Essence => 5,
            Self::Runes => 6,
            Self::RunicPower
            | Self::LunarPower
            | Self::Maelstrom
            | Self::Insanity
            | Self::Fury
            | Self::Pain => 100,
            Self::ArcaneCharges => 4,
        }
    }

    /// Does this resource regenerate passively?
    pub const fn has_passive_regen(self) -> bool {
        matches!(self, Self::Mana | Self::Focus | Self::Energy)
    }

    /// Base regen per second (before haste)
    pub const fn base_regen_per_sec(self) -> f32 {
        match self {
            Self::Energy => 10.0,
            Self::Focus => 5.0,
            Self::Mana => 0.01, // 1% per sec, multiplied by max
            _ => 0.0,
        }
    }
}
