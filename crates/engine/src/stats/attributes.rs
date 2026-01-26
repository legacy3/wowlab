use wowlab_common::types::{Attribute, SpecId};

/// Primary stat values
#[derive(Clone, Debug, Default)]
pub struct PrimaryStats {
    pub strength: f32,
    pub agility: f32,
    pub intellect: f32,
    pub stamina: f32,
}

impl PrimaryStats {
    pub fn get(&self, attr: Attribute) -> f32 {
        match attr {
            Attribute::Strength => self.strength,
            Attribute::Agility => self.agility,
            Attribute::Intellect => self.intellect,
            Attribute::Stamina => self.stamina,
        }
    }

    pub fn set(&mut self, attr: Attribute, value: f32) {
        match attr {
            Attribute::Strength => self.strength = value,
            Attribute::Agility => self.agility = value,
            Attribute::Intellect => self.intellect = value,
            Attribute::Stamina => self.stamina = value,
        }
    }

    pub fn add(&mut self, attr: Attribute, value: f32) {
        match attr {
            Attribute::Strength => self.strength += value,
            Attribute::Agility => self.agility += value,
            Attribute::Intellect => self.intellect += value,
            Attribute::Stamina => self.stamina += value,
        }
    }
}

/// Get the primary stat for a spec
pub fn primary_stat_for_spec(spec: SpecId) -> Attribute {
    use SpecId::*;
    match spec {
        // Agility specs
        BeastMastery | Marksmanship | Survival | Assassination | Outlaw | Subtlety | Feral
        | Guardian | Brewmaster | Windwalker | Havoc | Vengeance => Attribute::Agility,

        // Strength specs
        Arms | Fury | ProtWarrior | HolyPaladin | ProtPaladin | Retribution | Blood | FrostDK
        | Unholy => Attribute::Strength,

        // Intellect specs
        Discipline | HolyPriest | Shadow | Elemental | Enhancement | RestoShaman | Arcane
        | Fire | FrostMage | Affliction | Demonology | Destruction | Mistweaver | Balance
        | RestoDruid | Devastation | Preservation | Augmentation => Attribute::Intellect,
    }
}
