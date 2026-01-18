//! NewType wrappers for type-safe index operations.
//!
//! These wrappers prevent mixing up different index types (e.g., passing a spell index
//! where an aura index is expected) and provide validation at construction time.

use serde::{Deserialize, Serialize};
use std::fmt;

// =============================================================================
// SpellIdx - Index into spell definitions/states
// =============================================================================

/// A type-safe spell identifier (WoW spell ID).
///
/// Used to reference spells in cooldown lookups, damage calculations, and events.
/// The underlying u32 matches WoW's spell ID system.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct SpellIdx(pub u32);

impl SpellIdx {
    /// Create from raw u32 (unchecked, use in validated contexts)
    #[inline(always)]
    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx <= u32::MAX as usize {
            Some(Self(idx as u32))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u32 value
    #[inline(always)]
    pub const fn as_u32(self) -> u32 {
        self.0
    }

    /// Check if this is a valid spell ID (non-zero)
    #[inline(always)]
    pub const fn is_valid(self) -> bool {
        self.0 != 0
    }
}

impl fmt::Debug for SpellIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "SpellIdx({})", self.0)
    }
}

impl fmt::Display for SpellIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u32> for SpellIdx {
    #[inline(always)]
    fn from(id: u32) -> Self {
        Self(id)
    }
}

impl From<SpellIdx> for u32 {
    #[inline(always)]
    fn from(idx: SpellIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// AuraIdx - Index into aura definitions/instances
// =============================================================================

/// A type-safe aura identifier (WoW spell ID for auras).
///
/// Used to reference buffs/debuffs in aura tracking, effect application, and events.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct AuraIdx(pub u32);

impl AuraIdx {
    /// Create from raw u32 (unchecked, use in validated contexts)
    #[inline(always)]
    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx <= u32::MAX as usize {
            Some(Self(idx as u32))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u32 value
    #[inline(always)]
    pub const fn as_u32(self) -> u32 {
        self.0
    }

    /// Check if this is a valid aura ID (non-zero)
    #[inline(always)]
    pub const fn is_valid(self) -> bool {
        self.0 != 0
    }
}

impl fmt::Debug for AuraIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "AuraIdx({})", self.0)
    }
}

impl fmt::Display for AuraIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u32> for AuraIdx {
    #[inline(always)]
    fn from(id: u32) -> Self {
        Self(id)
    }
}

impl From<AuraIdx> for u32 {
    #[inline(always)]
    fn from(idx: AuraIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// ProcIdx - Index into proc definitions
// =============================================================================

/// A type-safe proc identifier (internal).
///
/// Used to reference proc handlers in the proc registry and ICD tracking.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct ProcIdx(pub u32);

impl ProcIdx {
    /// Create from raw u32
    #[inline(always)]
    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx <= u32::MAX as usize {
            Some(Self(idx as u32))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u32 value
    #[inline(always)]
    pub const fn as_u32(self) -> u32 {
        self.0
    }
}

impl fmt::Debug for ProcIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "ProcIdx({})", self.0)
    }
}

impl fmt::Display for ProcIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u32> for ProcIdx {
    #[inline(always)]
    fn from(id: u32) -> Self {
        Self(id)
    }
}

impl From<ProcIdx> for u32 {
    #[inline(always)]
    fn from(idx: ProcIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// UnitIdx - Index into unit list (player, pets, enemies)
// =============================================================================

/// A type-safe unit index.
///
/// Used to reference entities in the simulation:
/// - 0 = Player
/// - 1..N = Pets
/// - N+1.. = Enemies
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct UnitIdx(pub u16);

impl UnitIdx {
    /// Maximum number of units (64K)
    pub const MAX: usize = u16::MAX as usize;

    /// The player unit index
    pub const PLAYER: UnitIdx = UnitIdx(0);

    /// Create from raw u16
    #[inline(always)]
    pub const fn from_raw(idx: u16) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx <= Self::MAX {
            Some(Self(idx as u16))
        } else {
            None
        }
    }

    /// Create from usize, saturating at MAX
    #[inline]
    pub fn from_usize_saturating(idx: usize) -> Self {
        Self(idx.min(Self::MAX) as u16)
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u16 value
    #[inline(always)]
    pub const fn as_u16(self) -> u16 {
        self.0
    }

    /// Check if this is the player
    #[inline(always)]
    pub const fn is_player(self) -> bool {
        self.0 == 0
    }

    /// Iterate over unit indices 0..count
    pub fn iter(count: usize) -> impl Iterator<Item = UnitIdx> {
        (0..count.min(Self::MAX)).map(|i| UnitIdx(i as u16))
    }
}

impl fmt::Debug for UnitIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_player() {
            write!(f, "UnitIdx(PLAYER)")
        } else {
            write!(f, "UnitIdx({})", self.0)
        }
    }
}

impl fmt::Display for UnitIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u16> for UnitIdx {
    #[inline(always)]
    fn from(idx: u16) -> Self {
        Self(idx)
    }
}

impl From<UnitIdx> for u16 {
    #[inline(always)]
    fn from(idx: UnitIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// TargetIdx - Index into target list (for multi-target scenarios)
// =============================================================================

/// A type-safe target index.
///
/// Used to reference targets (enemies) for damage/debuff application.
/// Target 0 is the primary target.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct TargetIdx(pub u16);

impl TargetIdx {
    /// Maximum number of targets (64K)
    pub const MAX: usize = u16::MAX as usize;

    /// The primary target index
    pub const PRIMARY: TargetIdx = TargetIdx(0);

    /// Create from raw u16
    #[inline(always)]
    pub const fn from_raw(idx: u16) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx <= Self::MAX {
            Some(Self(idx as u16))
        } else {
            None
        }
    }

    /// Create from usize, saturating at MAX
    #[inline]
    pub fn from_usize_saturating(idx: usize) -> Self {
        Self(idx.min(Self::MAX) as u16)
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u16 value
    #[inline(always)]
    pub const fn as_u16(self) -> u16 {
        self.0
    }

    /// Check if this is the primary target
    #[inline(always)]
    pub const fn is_primary(self) -> bool {
        self.0 == 0
    }

    /// Iterate over target indices 0..count
    pub fn iter(count: usize) -> impl Iterator<Item = TargetIdx> {
        (0..count.min(Self::MAX)).map(|i| TargetIdx(i as u16))
    }
}

impl fmt::Debug for TargetIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_primary() {
            write!(f, "TargetIdx(PRIMARY)")
        } else {
            write!(f, "TargetIdx({})", self.0)
        }
    }
}

impl fmt::Display for TargetIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u16> for TargetIdx {
    #[inline(always)]
    fn from(idx: u16) -> Self {
        Self(idx)
    }
}

impl From<TargetIdx> for u16 {
    #[inline(always)]
    fn from(idx: TargetIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// PetIdx - Index into pet list
// =============================================================================

/// A type-safe pet index.
///
/// Used to reference pets in the simulation. Separate from UnitIdx for
/// type safety when only pets are valid.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct PetIdx(pub u16);

impl PetIdx {
    /// Maximum number of pets
    pub const MAX: usize = 256;

    /// The primary (main) pet
    pub const PRIMARY: PetIdx = PetIdx(0);

    /// Create from raw u16
    #[inline(always)]
    pub const fn from_raw(idx: u16) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx < Self::MAX {
            Some(Self(idx as u16))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u16 value
    #[inline(always)]
    pub const fn as_u16(self) -> u16 {
        self.0
    }

    /// Check if this is the primary pet
    #[inline(always)]
    pub const fn is_primary(self) -> bool {
        self.0 == 0
    }

    /// Convert to UnitIdx (pets start at unit index 1)
    #[inline(always)]
    pub const fn to_unit_idx(self) -> UnitIdx {
        UnitIdx(self.0 + 1)
    }

    /// Iterate over pet indices 0..count
    pub fn iter(count: usize) -> impl Iterator<Item = PetIdx> {
        (0..count.min(Self::MAX)).map(|i| PetIdx(i as u16))
    }
}

impl fmt::Debug for PetIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_primary() {
            write!(f, "PetIdx(PRIMARY)")
        } else {
            write!(f, "PetIdx({})", self.0)
        }
    }
}

impl fmt::Display for PetIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u16> for PetIdx {
    #[inline(always)]
    fn from(idx: u16) -> Self {
        Self(idx)
    }
}

impl From<PetIdx> for u16 {
    #[inline(always)]
    fn from(idx: PetIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// EnemyIdx - Index into enemy list
// =============================================================================

/// A type-safe enemy index.
///
/// Used to reference enemies in the simulation. Separate from UnitIdx and
/// TargetIdx for type safety in enemy-specific operations.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct EnemyIdx(pub u16);

impl EnemyIdx {
    /// Maximum number of enemies
    pub const MAX: usize = 256;

    /// The primary (boss) enemy
    pub const PRIMARY: EnemyIdx = EnemyIdx(0);

    /// Create from raw u16
    #[inline(always)]
    pub const fn from_raw(idx: u16) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx < Self::MAX {
            Some(Self(idx as u16))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u16 value
    #[inline(always)]
    pub const fn as_u16(self) -> u16 {
        self.0
    }

    /// Check if this is the primary enemy
    #[inline(always)]
    pub const fn is_primary(self) -> bool {
        self.0 == 0
    }

    /// Convert to TargetIdx (enemies map 1:1 to targets)
    #[inline(always)]
    pub const fn to_target_idx(self) -> TargetIdx {
        TargetIdx(self.0)
    }

    /// Iterate over enemy indices 0..count
    pub fn iter(count: usize) -> impl Iterator<Item = EnemyIdx> {
        (0..count.min(Self::MAX)).map(|i| EnemyIdx(i as u16))
    }
}

impl fmt::Debug for EnemyIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_primary() {
            write!(f, "EnemyIdx(PRIMARY)")
        } else {
            write!(f, "EnemyIdx({})", self.0)
        }
    }
}

impl fmt::Display for EnemyIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u16> for EnemyIdx {
    #[inline(always)]
    fn from(idx: u16) -> Self {
        Self(idx)
    }
}

impl From<EnemyIdx> for u16 {
    #[inline(always)]
    fn from(idx: EnemyIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// SnapshotIdx - Index for tracking snapshotted state
// =============================================================================

/// A unique identifier for snapshotted state.
///
/// Used to track stats at the time of cast for delayed damage application
/// (travel time, etc.). Each snapshot gets a unique incrementing ID.
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct SnapshotIdx(pub u32);

impl SnapshotIdx {
    /// Invalid/null snapshot
    pub const INVALID: SnapshotIdx = SnapshotIdx(0);

    /// Create from raw u32
    #[inline(always)]
    pub const fn from_raw(id: u32) -> Self {
        Self(id)
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u32 value
    #[inline(always)]
    pub const fn as_u32(self) -> u32 {
        self.0
    }

    /// Check if this is a valid snapshot
    #[inline(always)]
    pub const fn is_valid(self) -> bool {
        self.0 != 0
    }

    /// Get next snapshot ID
    #[inline(always)]
    pub const fn next(self) -> Self {
        Self(self.0.wrapping_add(1))
    }
}

impl fmt::Debug for SnapshotIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if !self.is_valid() {
            write!(f, "SnapshotIdx(INVALID)")
        } else {
            write!(f, "SnapshotIdx({})", self.0)
        }
    }
}

impl fmt::Display for SnapshotIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u32> for SnapshotIdx {
    #[inline(always)]
    fn from(id: u32) -> Self {
        Self(id)
    }
}

impl From<SnapshotIdx> for u32 {
    #[inline(always)]
    fn from(idx: SnapshotIdx) -> Self {
        idx.0
    }
}

// =============================================================================
// ResourceIdx - Index into resource types
// =============================================================================

/// A type-safe resource index.
///
/// Used to reference different resource types (mana, rage, energy, focus, etc.).
#[derive(Copy, Clone, Default, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct ResourceIdx(pub u8);

impl ResourceIdx {
    /// Maximum number of resource types
    pub const MAX: usize = 32;

    /// Common resource indices
    pub const MANA: ResourceIdx = ResourceIdx(0);
    pub const RAGE: ResourceIdx = ResourceIdx(1);
    pub const FOCUS: ResourceIdx = ResourceIdx(2);
    pub const ENERGY: ResourceIdx = ResourceIdx(3);
    pub const COMBO_POINTS: ResourceIdx = ResourceIdx(4);
    pub const RUNES: ResourceIdx = ResourceIdx(5);
    pub const RUNIC_POWER: ResourceIdx = ResourceIdx(6);
    pub const SOUL_SHARDS: ResourceIdx = ResourceIdx(7);
    pub const ASTRAL_POWER: ResourceIdx = ResourceIdx(8);
    pub const HOLY_POWER: ResourceIdx = ResourceIdx(9);
    pub const MAELSTROM: ResourceIdx = ResourceIdx(10);
    pub const CHI: ResourceIdx = ResourceIdx(11);
    pub const INSANITY: ResourceIdx = ResourceIdx(12);
    pub const FURY: ResourceIdx = ResourceIdx(13);
    pub const PAIN: ResourceIdx = ResourceIdx(14);
    pub const ESSENCE: ResourceIdx = ResourceIdx(15);

    /// Create from raw u8
    #[inline(always)]
    pub const fn from_raw(idx: u8) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    #[inline]
    pub fn try_from_usize(idx: usize) -> Option<Self> {
        if idx < Self::MAX {
            Some(Self(idx as u8))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u8 value
    #[inline(always)]
    pub const fn as_u8(self) -> u8 {
        self.0
    }
}

impl fmt::Debug for ResourceIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "ResourceIdx({})", self.0)
    }
}

impl fmt::Display for ResourceIdx {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<u8> for ResourceIdx {
    #[inline(always)]
    fn from(idx: u8) -> Self {
        Self(idx)
    }
}

impl From<ResourceIdx> for u8 {
    #[inline(always)]
    fn from(idx: ResourceIdx) -> Self {
        idx.0
    }
}
