use crate::actor::{Enemy, Player};
use crate::aura::AuraTracker;
use crate::combat::ActionState;
use wowlab_common::types::{DamageSchool, SimTime, SpellIdx, TargetIdx};

/// Context for checking if a spell can be cast
#[derive(Clone, Debug)]
pub struct CastCheck<'a> {
    pub player: &'a Player,
    pub target: Option<&'a Enemy>,
    pub auras: &'a AuraTracker,
    pub now: SimTime,
}

impl<'a> CastCheck<'a> {
    pub fn new(player: &'a Player, auras: &'a AuraTracker, now: SimTime) -> Self {
        Self {
            player,
            target: None,
            auras,
            now,
        }
    }

    pub fn with_target(mut self, target: &'a Enemy) -> Self {
        self.target = Some(target);
        self
    }
}

/// Context for executing a spell
#[derive(Clone, Debug)]
pub struct CastContext {
    /// Spell being cast
    pub spell: SpellIdx,
    /// Target
    pub target: TargetIdx,
    /// Cast start time
    pub start_time: SimTime,
    /// When cast completes
    pub complete_time: SimTime,
    /// Snapshotted stats
    pub snapshot: ActionState,
    /// Was this a proc (not directly cast)
    pub is_proc: bool,
}

impl CastContext {
    pub fn new(spell: SpellIdx, target: TargetIdx, now: SimTime) -> Self {
        Self {
            spell,
            target,
            start_time: now,
            complete_time: now,
            snapshot: ActionState::new(),
            is_proc: false,
        }
    }

    pub fn with_cast_time(mut self, cast_time: SimTime) -> Self {
        self.complete_time = self.start_time + cast_time;
        self
    }

    pub fn with_snapshot(mut self, snapshot: ActionState) -> Self {
        self.snapshot = snapshot;
        self
    }

    pub fn as_proc(mut self) -> Self {
        self.is_proc = true;
        self
    }

    /// Cast duration
    pub fn duration(&self) -> SimTime {
        self.complete_time - self.start_time
    }
}

/// Result of attempting to cast
#[derive(Clone, Debug)]
pub enum CastResult {
    /// Cast started (or completed if instant)
    Success(CastContext),
    /// On GCD
    OnGcd { remaining: SimTime },
    /// On cooldown
    OnCooldown { remaining: SimTime },
    /// Not enough resource
    NotEnoughResource {
        resource: wowlab_common::types::ResourceType,
        have: f32,
        need: f32,
    },
    /// Missing required aura
    MissingRequiredAura { aura: wowlab_common::types::AuraIdx },
    /// Invalid target
    InvalidTarget,
    /// Out of range
    OutOfRange { distance: f32, range: f32 },
    /// Currently casting
    AlreadyCasting,
    /// Cannot cast while moving
    Moving,
}

impl CastResult {
    pub fn is_success(&self) -> bool {
        matches!(self, CastResult::Success(_))
    }
}

/// Damage event produced by spell
#[derive(Clone, Debug)]
pub struct DamageEvent {
    pub spell: SpellIdx,
    pub target: TargetIdx,
    pub amount: f32,
    pub school: DamageSchool,
    pub is_crit: bool,
    pub is_periodic: bool,
    pub timestamp: SimTime,
}

/// Resource event
#[derive(Clone, Debug)]
pub struct ResourceEvent {
    pub resource: wowlab_common::types::ResourceType,
    pub amount: f32,
    pub is_gain: bool,
    pub source: SpellIdx,
    pub timestamp: SimTime,
}
