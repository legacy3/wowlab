//! Damage types and flags.

use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use strum::{Display, EnumCount, EnumIter, EnumString};

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Default,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum DamageSchool {
    #[default]
    Physical = 0,
    Holy = 1,
    Fire = 2,
    Nature = 3,
    Frost = 4,
    Shadow = 5,
    Arcane = 6,
    Chaos = 7,
}

impl DamageSchool {
    pub const fn is_physical(self) -> bool {
        matches!(self, Self::Physical)
    }

    pub const fn is_magic(self) -> bool {
        !self.is_physical()
    }
}

bitflags::bitflags! {
    #[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
    #[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
    #[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
    pub struct DamageFlags: u8 {
        const CRIT = 1 << 0;
        const PERIODIC = 1 << 1;
        const PET = 1 << 2;
        const AOE = 1 << 3;
        const PROC = 1 << 4;
    }
}

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Default,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum HitResult {
    #[default]
    Hit = 0,
    Crit = 1,
    Miss = 2,
    Dodge = 3,
    Parry = 4,
}

impl HitResult {
    pub const fn is_hit(self) -> bool {
        matches!(self, Self::Hit | Self::Crit)
    }

    pub const fn is_crit(self) -> bool {
        matches!(self, Self::Crit)
    }
}
