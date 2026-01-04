//! Paperdoll system for character stat management.
//!
//! This module handles all aspects of character stats:
//! - Base stats from race, class, and level
//! - Gear stats from equipment, enchants, and gems
//! - Rating conversions with diminishing returns
//! - Active modifiers from buffs and debuffs
//! - Stat caching for performance
//! - Pet stat inheritance
//!
//! # Architecture
//!
//! ```text
//! BaseStats + GearStats + ActiveModifiers
//!                    |
//!                    v
//!               Paperdoll.recompute()
//!                    |
//!                    v
//!               StatCache (hot path access)
//! ```
//!
//! # Usage
//!
//! ```rust,ignore
//! use engine::paperdoll::{Paperdoll, ClassId, SpecId, RaceId, AuraStatEffect, Attribute};
//!
//! // Create a new paperdoll
//! let mut paperdoll = Paperdoll::new(80, ClassId::Hunter, SpecId::BeastMastery, RaceId::Orc);
//!
//! // Set gear stats
//! paperdoll.gear.attributes[Attribute::Agility as usize] = 10000.0;
//! paperdoll.gear.ratings[RatingType::CritMelee as usize] = 2500.0;
//!
//! // Recompute all stats
//! paperdoll.recompute();
//!
//! // Access cached values in hot path
//! let damage = base_damage * paperdoll.cache.total_damage_mult;
//!
//! // Apply aura effects
//! let bestial_wrath = AuraStatEffect::DamageDone(25.0);
//! paperdoll.apply_aura_effect(&bestial_wrath);
//! paperdoll.recompute();
//! ```

pub mod coefficients;
pub mod paperdoll;
pub mod pet;
pub mod rating;
pub mod types;

// Re-export coefficients
pub use coefficients::{from_spec, ClassCoefficients};

// Re-export main paperdoll types
pub use paperdoll::{
    ActiveModifiers, AuraStatEffect, BaseStats, GearStats, Paperdoll,
    StatCache as PaperdollStatCache,
};

// Re-export pet types
pub use pet::{OwnerStats, PetCoefficients, PetStats};

// Re-export rating types
pub use rating::{apply_dr, rating_to_percent, RatingTable};

// Re-export all type enums
pub use types::{Attribute, CacheKey, ClassId, PetType, RaceId, RatingType, SpecId};
