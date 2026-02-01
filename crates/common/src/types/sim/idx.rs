//! NewType wrappers for type-safe index operations.
//!
//! These wrappers prevent mixing up different index types (e.g., passing a spell index
//! where an aura index is expected) and provide validation at construction time.

use derive_more::{Debug, Display, From, Into};
use ref_cast::RefCast;
use serde::{Deserialize, Serialize};

// SpellIdx - Index into spell definitions/states

/// A type-safe spell identifier (WoW spell ID).
///
/// Used to reference spells in cooldown lookups, damage calculations, and events.
/// The underlying u32 matches WoW's spell ID system.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("SpellIdx({_0})")]
#[display("{_0}")]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct SpellIdx(pub u32);

impl SpellIdx {
    /// Cast a slice of u32 to SpellIdx zero-copy.
    /// # Safety
    /// SpellIdx is #[repr(transparent)] over u32.
    #[inline]
    pub fn cast_slice(slice: &[u32]) -> &[Self] {
        // SAFETY: SpellIdx is repr(transparent) over u32
        unsafe { &*(slice as *const [u32] as *const [Self]) }
    }

    /// Cast a mutable slice of u32 to SpellIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u32]) -> &mut [Self] {
        // SAFETY: SpellIdx is repr(transparent) over u32
        unsafe { &mut *(slice as *mut [u32] as *mut [Self]) }
    }

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

// AuraIdx - Index into aura definitions/instances

/// A type-safe aura identifier (WoW spell ID for auras).
///
/// Used to reference buffs/debuffs in aura tracking, effect application, and events.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("AuraIdx({_0})")]
#[display("{_0}")]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct AuraIdx(pub u32);

impl AuraIdx {
    /// Cast a slice of u32 to AuraIdx zero-copy.
    /// # Safety
    /// AuraIdx is #[repr(transparent)] over u32.
    #[inline]
    pub fn cast_slice(slice: &[u32]) -> &[Self] {
        // SAFETY: AuraIdx is repr(transparent) over u32
        unsafe { &*(slice as *const [u32] as *const [Self]) }
    }

    /// Cast a mutable slice of u32 to AuraIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u32]) -> &mut [Self] {
        // SAFETY: AuraIdx is repr(transparent) over u32
        unsafe { &mut *(slice as *mut [u32] as *mut [Self]) }
    }

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

// ProcIdx - Index into proc definitions

/// A type-safe proc identifier (internal).
///
/// Used to reference proc handlers in the proc registry and ICD tracking.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("ProcIdx({_0})")]
#[display("{_0}")]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct ProcIdx(pub u32);

impl ProcIdx {
    /// Cast a slice of u32 to ProcIdx zero-copy.
    /// # Safety
    /// ProcIdx is #[repr(transparent)] over u32.
    #[inline]
    pub fn cast_slice(slice: &[u32]) -> &[Self] {
        // SAFETY: ProcIdx is repr(transparent) over u32
        unsafe { &*(slice as *const [u32] as *const [Self]) }
    }

    /// Cast a mutable slice of u32 to ProcIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u32]) -> &mut [Self] {
        // SAFETY: ProcIdx is repr(transparent) over u32
        unsafe { &mut *(slice as *mut [u32] as *mut [Self]) }
    }

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

// UnitIdx - Index into unit list (player, pets, enemies)

/// A type-safe unit index.
///
/// Used to reference entities in the simulation:
/// - 0 = Player
/// - 1..N = Pets
/// - N+1.. = Enemies
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("{}", if *_0 == 0 { "UnitIdx(PLAYER)".to_string() } else { format!("UnitIdx({})", _0) })]
#[display("{_0}")]
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

    /// Cast a slice of u16 to UnitIdx zero-copy.
    /// # Safety
    /// UnitIdx is #[repr(transparent)] over u16.
    #[inline]
    pub fn cast_slice(slice: &[u16]) -> &[Self] {
        // SAFETY: UnitIdx is repr(transparent) over u16
        unsafe { &*(slice as *const [u16] as *const [Self]) }
    }

    /// Cast a mutable slice of u16 to UnitIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u16]) -> &mut [Self] {
        // SAFETY: UnitIdx is repr(transparent) over u16
        unsafe { &mut *(slice as *mut [u16] as *mut [Self]) }
    }

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

// TargetIdx - Index into target list (for multi-target scenarios)

/// A type-safe target index.
///
/// Used to reference targets (enemies) for damage/debuff application.
/// Target 0 is the primary target.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("{}", if *_0 == 0 { "TargetIdx(PRIMARY)".to_string() } else { format!("TargetIdx({})", _0) })]
#[display("{_0}")]
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

    /// Cast a slice of u16 to TargetIdx zero-copy.
    /// # Safety
    /// TargetIdx is #[repr(transparent)] over u16.
    #[inline]
    pub fn cast_slice(slice: &[u16]) -> &[Self] {
        // SAFETY: TargetIdx is repr(transparent) over u16
        unsafe { &*(slice as *const [u16] as *const [Self]) }
    }

    /// Cast a mutable slice of u16 to TargetIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u16]) -> &mut [Self] {
        // SAFETY: TargetIdx is repr(transparent) over u16
        unsafe { &mut *(slice as *mut [u16] as *mut [Self]) }
    }

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

// PetIdx - Index into pet list

/// A type-safe pet index.
///
/// Used to reference pets in the simulation. Separate from UnitIdx for
/// type safety when only pets are valid.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("{}", if *_0 == 0 { "PetIdx(PRIMARY)".to_string() } else { format!("PetIdx({})", _0) })]
#[display("{_0}")]
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

    /// Cast a slice of u16 to PetIdx zero-copy.
    /// # Safety
    /// PetIdx is #[repr(transparent)] over u16.
    #[inline]
    pub fn cast_slice(slice: &[u16]) -> &[Self] {
        // SAFETY: PetIdx is repr(transparent) over u16
        unsafe { &*(slice as *const [u16] as *const [Self]) }
    }

    /// Cast a mutable slice of u16 to PetIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u16]) -> &mut [Self] {
        // SAFETY: PetIdx is repr(transparent) over u16
        unsafe { &mut *(slice as *mut [u16] as *mut [Self]) }
    }

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

// EnemyIdx - Index into enemy list

/// A type-safe enemy index.
///
/// Used to reference enemies in the simulation. Separate from UnitIdx and
/// TargetIdx for type safety in enemy-specific operations.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("{}", if *_0 == 0 { "EnemyIdx(PRIMARY)".to_string() } else { format!("EnemyIdx({})", _0) })]
#[display("{_0}")]
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

    /// Cast a slice of u16 to EnemyIdx zero-copy.
    /// # Safety
    /// EnemyIdx is #[repr(transparent)] over u16.
    #[inline]
    pub fn cast_slice(slice: &[u16]) -> &[Self] {
        // SAFETY: EnemyIdx is repr(transparent) over u16
        unsafe { &*(slice as *const [u16] as *const [Self]) }
    }

    /// Cast a mutable slice of u16 to EnemyIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u16]) -> &mut [Self] {
        // SAFETY: EnemyIdx is repr(transparent) over u16
        unsafe { &mut *(slice as *mut [u16] as *mut [Self]) }
    }

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

// SnapshotIdx - Index for tracking snapshotted state

/// A unique identifier for snapshotted state.
///
/// Used to track stats at the time of cast for delayed damage application
/// (travel time, etc.). Each snapshot gets a unique incrementing ID.
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("{}", if *_0 == 0 { "SnapshotIdx(INVALID)".to_string() } else { format!("SnapshotIdx({})", _0) })]
#[display("{_0}")]
#[serde(transparent)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(transparent)]
pub struct SnapshotIdx(pub u32);

impl SnapshotIdx {
    /// Invalid/null snapshot
    pub const INVALID: SnapshotIdx = SnapshotIdx(0);

    /// Cast a slice of u32 to SnapshotIdx zero-copy.
    /// # Safety
    /// SnapshotIdx is #[repr(transparent)] over u32.
    #[inline]
    pub fn cast_slice(slice: &[u32]) -> &[Self] {
        // SAFETY: SnapshotIdx is repr(transparent) over u32
        unsafe { &*(slice as *const [u32] as *const [Self]) }
    }

    /// Cast a mutable slice of u32 to SnapshotIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u32]) -> &mut [Self] {
        // SAFETY: SnapshotIdx is repr(transparent) over u32
        unsafe { &mut *(slice as *mut [u32] as *mut [Self]) }
    }

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

// ResourceIdx - Index into resource types

/// A type-safe resource index.
///
/// Used to reference different resource types (mana, rage, energy, focus, etc.).
#[derive(
    Copy,
    Clone,
    Default,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Serialize,
    Deserialize,
    Debug,
    Display,
    From,
    Into,
    RefCast,
)]
#[debug("ResourceIdx({_0})")]
#[display("{_0}")]
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

    /// Cast a slice of u8 to ResourceIdx zero-copy.
    /// # Safety
    /// ResourceIdx is #[repr(transparent)] over u8.
    #[inline]
    pub fn cast_slice(slice: &[u8]) -> &[Self] {
        // SAFETY: ResourceIdx is repr(transparent) over u8
        unsafe { &*(slice as *const [u8] as *const [Self]) }
    }

    /// Cast a mutable slice of u8 to ResourceIdx zero-copy.
    #[inline]
    pub fn cast_slice_mut(slice: &mut [u8]) -> &mut [Self] {
        // SAFETY: ResourceIdx is repr(transparent) over u8
        unsafe { &mut *(slice as *mut [u8] as *mut [Self]) }
    }

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
