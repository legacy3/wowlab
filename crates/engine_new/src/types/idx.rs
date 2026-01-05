/// Spell ID (matches WoW spell IDs)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SpellIdx(pub u32);

/// Aura ID (matches WoW spell IDs for auras)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct AuraIdx(pub u32);

/// Proc ID (internal identifier)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct ProcIdx(pub u32);

/// Index into unit list (player=0, pets=1+, enemies after)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct UnitIdx(pub u8);

/// Index into target list
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct TargetIdx(pub u8);

/// Unique index for tracking snapshotted state (for delayed damage)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SnapshotIdx(pub u32);

impl UnitIdx {
    pub const PLAYER: UnitIdx = UnitIdx(0);
}

impl TargetIdx {
    pub const PRIMARY: TargetIdx = TargetIdx(0);
}
