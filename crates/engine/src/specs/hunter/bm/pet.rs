use super::constants::*;
use crate::actor::Pet;
use crate::combat::Cooldown;
use crate::types::{PetKind, SimTime, UnitIdx};

/// Create a BM Hunter pet
pub fn create_pet(owner: UnitIdx) -> Pet {
    let mut pet = Pet::new(UnitIdx(1), owner, PetKind::Permanent, "Pet");

    // Pet has Stomp on a 10s cooldown
    pet.add_cooldown(PET_STOMP, Cooldown::new(10.0));

    pet
}

/// Pet damage coefficients
pub struct PetDamage;

impl PetDamage {
    /// Base auto-attack damage (as % of owner AP)
    pub const AUTO_ATTACK_COEF: f32 = 0.5;

    /// Kill Command damage (as % of owner AP)
    pub const KILL_COMMAND_COEF: f32 = 2.0;

    /// Stomp damage (as % of owner AP)
    pub const STOMP_COEF: f32 = 0.25;

    /// Pet base attack speed
    pub const ATTACK_SPEED: SimTime = SimTime::from_millis(2000);

    /// Pet stat inheritance from owner
    pub const STAT_INHERITANCE: f32 = 0.6; // 60% of owner stats
}
