//! Rotation scripting benchmark implementations
//!
//! Compares different approaches for rotation decision-making:
//! - Rhai scripting (current baseline)
//! - Custom bytecode VM
//! - Native Rust enum dispatch
//! - Decision tree
//! - Lookup table

pub mod state;
pub mod rhai_baseline;
pub mod bytecode_vm;
pub mod native_enum;
pub mod decision_tree;
pub mod lookup_table;
pub mod cranelift_jit;

pub use state::GameState;

/// Action returned by rotation evaluation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Action {
    None = 0,
    Cast(SpellId),
    WaitGcd,
    Wait(u16), // centiseconds
}

/// Spell identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct SpellId(pub u16);

impl SpellId {
    pub const BESTIAL_WRATH: Self = Self(1);
    pub const KILL_COMMAND: Self = Self(2);
    pub const BARBED_SHOT: Self = Self(3);
    pub const COBRA_SHOT: Self = Self(4);
    pub const KILL_SHOT: Self = Self(5);
    pub const DIRE_BEAST: Self = Self(6);
    pub const CALL_OF_THE_WILD: Self = Self(7);
}

/// Aura identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct AuraId(pub u16);

impl AuraId {
    pub const BESTIAL_WRATH: Self = Self(1);
    pub const FRENZY: Self = Self(2);
    pub const CALL_OF_THE_WILD: Self = Self(3);
}
