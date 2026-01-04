/// Index into spell registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SpellIdx(pub u16);

/// Index into aura registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct AuraIdx(pub u16);

/// Index into proc registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct ProcIdx(pub u16);

/// Index into unit list (player=0, pets=1+, enemies after)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct UnitIdx(pub u8);

/// Index into target list
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct TargetIdx(pub u8);

impl UnitIdx {
    pub const PLAYER: UnitIdx = UnitIdx(0);
}

impl TargetIdx {
    pub const PRIMARY: TargetIdx = TargetIdx(0);
}
