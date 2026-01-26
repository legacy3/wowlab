//! Game entity types (classes, specs, attributes).

mod attribute;
mod class;

pub use attribute::{Attribute, DerivedStat, MasteryEffect, RatingType};
pub use class::{ClassId, PetKind, PetType, RaceId, SpecId};
