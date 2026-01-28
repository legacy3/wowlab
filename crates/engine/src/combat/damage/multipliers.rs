use wowlab_common::types::DamageSchool;

#[derive(Clone, Debug)]
pub struct DamageMultipliers {
    pub action: f32,
    pub da: f32,
    pub ta: f32,
    pub persistent: f32,
    pub player: f32,
    pub target: f32,
    pub versatility: f32,
    pub pet: f32,
    pub crit: f32,
}

impl Default for DamageMultipliers {
    fn default() -> Self {
        Self {
            action: 1.0,
            da: 1.0,
            ta: 1.0,
            persistent: 1.0,
            player: 1.0,
            target: 1.0,
            versatility: 0.0,
            pet: 1.0,
            crit: 2.0,
        }
    }
}

impl DamageMultipliers {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn total_da(&self, is_crit: bool) -> f32 {
        let mut mult = self.action
            * self.da
            * self.persistent
            * self.player
            * self.target
            * (1.0 + self.versatility)
            * self.pet;

        if is_crit {
            mult *= self.crit;
        }

        mult
    }

    pub fn total_ta(&self, is_crit: bool) -> f32 {
        let mut mult = self.action
            * self.ta
            * self.persistent
            * self.player
            * self.target
            * (1.0 + self.versatility)
            * self.pet;

        if is_crit {
            mult *= self.crit;
        }

        mult
    }
}

#[derive(Clone, Debug, Default)]
pub struct SchoolModifiers {
    pub physical: f32,
    pub holy: f32,
    pub fire: f32,
    pub nature: f32,
    pub frost: f32,
    pub shadow: f32,
    pub arcane: f32,
    pub chaos: f32,
}

impl SchoolModifiers {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get(&self, school: DamageSchool) -> f32 {
        match school {
            DamageSchool::Physical => self.physical,
            DamageSchool::Holy => self.holy,
            DamageSchool::Fire => self.fire,
            DamageSchool::Nature => self.nature,
            DamageSchool::Frost => self.frost,
            DamageSchool::Shadow => self.shadow,
            DamageSchool::Arcane => self.arcane,
            DamageSchool::Chaos => self.chaos,
        }
    }

    pub fn set(&mut self, school: DamageSchool, value: f32) {
        match school {
            DamageSchool::Physical => self.physical = value,
            DamageSchool::Holy => self.holy = value,
            DamageSchool::Fire => self.fire = value,
            DamageSchool::Nature => self.nature = value,
            DamageSchool::Frost => self.frost = value,
            DamageSchool::Shadow => self.shadow = value,
            DamageSchool::Arcane => self.arcane = value,
            DamageSchool::Chaos => self.chaos = value,
        }
    }
}
