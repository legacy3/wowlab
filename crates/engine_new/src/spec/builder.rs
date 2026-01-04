use super::{SpellDef, AuraDef, CastType, GcdType, SpellTarget, SpellFlags, DamageEffect, ResourceCost, AuraEffect};
use crate::types::{SpellIdx, AuraIdx, ResourceType, SimTime, DamageSchool, DerivedStat};
use crate::aura::PeriodicEffect;

/// Builder for spell definitions
pub struct SpellBuilder {
    spell: SpellDef,
}

impl SpellBuilder {
    pub fn new(id: SpellIdx, name: &'static str) -> Self {
        Self {
            spell: SpellDef::new(id, name),
        }
    }

    pub fn school(mut self, school: DamageSchool) -> Self {
        self.spell.school = school;
        self
    }

    pub fn instant(mut self) -> Self {
        self.spell.cast_type = CastType::Instant;
        self
    }

    pub fn cast_time(mut self, ms: u32) -> Self {
        self.spell.cast_type = CastType::Cast(ms);
        self.spell.castable_while_moving = false;
        self
    }

    pub fn channel(mut self, duration_ms: u32, ticks: u8) -> Self {
        self.spell.cast_type = CastType::Channel { duration: duration_ms, ticks };
        self.spell.castable_while_moving = false;
        self
    }

    pub fn gcd(mut self, gcd: GcdType) -> Self {
        self.spell.gcd = gcd;
        self
    }

    pub fn no_gcd(mut self) -> Self {
        self.spell.gcd = GcdType::None;
        self.spell.flags.remove(SpellFlags::ON_GCD);
        self.spell.flags.insert(SpellFlags::IGNORES_GCD);
        self
    }

    pub fn off_gcd(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::OFF_GCD);
        self
    }

    pub fn cooldown(mut self, secs: f32) -> Self {
        self.spell.cooldown = SimTime::from_secs_f32(secs);
        self
    }

    pub fn charges(mut self, count: u8, recharge_secs: f32) -> Self {
        self.spell.charges = count;
        self.spell.charge_time = SimTime::from_secs_f32(recharge_secs);
        self
    }

    pub fn cost(mut self, resource: ResourceType, amount: f32) -> Self {
        self.spell.costs.push(ResourceCost::new(resource, amount));
        self
    }

    pub fn cost_percent(mut self, resource: ResourceType, percent: f32) -> Self {
        self.spell.costs.push(ResourceCost::percent(resource, percent));
        self
    }

    pub fn gain(mut self, resource: ResourceType, amount: f32) -> Self {
        self.spell.gains.push(ResourceCost::new(resource, amount));
        self
    }

    pub fn target(mut self, target: SpellTarget) -> Self {
        self.spell.target = target;
        self
    }

    pub fn range(mut self, yards: f32) -> Self {
        self.spell.range = yards;
        self
    }

    pub fn melee_range(mut self) -> Self {
        self.spell.range = 5.0;
        self
    }

    pub fn damage(mut self, effect: DamageEffect) -> Self {
        self.spell.damage = Some(effect);
        self
    }

    pub fn physical_damage(mut self, ap_coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school: DamageSchool::Physical,
            ap_coefficient: ap_coef,
            ..Default::default()
        });
        self.spell.school = DamageSchool::Physical;
        self
    }

    pub fn spell_damage(mut self, school: DamageSchool, sp_coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school,
            sp_coefficient: sp_coef,
            ..Default::default()
        });
        self.spell.school = school;
        self
    }

    pub fn weapon_damage(mut self, coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school: DamageSchool::Physical,
            weapon_coefficient: coef,
            ..Default::default()
        });
        self.spell.school = DamageSchool::Physical;
        self
    }

    pub fn apply_aura(mut self, aura: AuraIdx) -> Self {
        self.spell.apply_auras.push(aura);
        self
    }

    pub fn requires(mut self, aura: AuraIdx) -> Self {
        self.spell.requires_aura = Some(aura);
        self
    }

    pub fn consumes(mut self, aura: AuraIdx) -> Self {
        self.spell.consumes_aura = Some(aura);
        self
    }

    pub fn travel_time(mut self, ms: u32) -> Self {
        self.spell.travel_time = ms;
        self
    }

    pub fn movable(mut self) -> Self {
        self.spell.castable_while_moving = true;
        self
    }

    pub fn pet_ability(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::PET_ABILITY);
        self
    }

    pub fn background(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::BACKGROUND);
        self
    }

    pub fn build(self) -> SpellDef {
        self.spell
    }
}

/// Builder for aura definitions
pub struct AuraBuilder {
    aura: AuraDef,
}

impl AuraBuilder {
    pub fn buff(id: AuraIdx, name: &'static str, duration_secs: f32) -> Self {
        Self {
            aura: AuraDef::buff(id, name, SimTime::from_secs_f32(duration_secs)),
        }
    }

    pub fn debuff(id: AuraIdx, name: &'static str, duration_secs: f32) -> Self {
        Self {
            aura: AuraDef::debuff(id, name, SimTime::from_secs_f32(duration_secs)),
        }
    }

    pub fn dot(id: AuraIdx, name: &'static str, duration_secs: f32, tick_interval_secs: f32) -> Self {
        Self {
            aura: AuraDef::dot(
                id,
                name,
                SimTime::from_secs_f32(duration_secs),
                SimTime::from_secs_f32(tick_interval_secs),
            ),
        }
    }

    pub fn stacks(mut self, max: u8) -> Self {
        self.aura.max_stacks = max;
        self
    }

    pub fn pandemic(mut self) -> Self {
        self.aura.flags.can_pandemic = true;
        self
    }

    pub fn snapshots(mut self) -> Self {
        self.aura.flags.snapshots = true;
        self
    }

    pub fn refreshable(mut self) -> Self {
        self.aura.flags.refreshable = true;
        self
    }

    pub fn hidden(mut self) -> Self {
        self.aura.flags.is_hidden = true;
        self
    }

    pub fn attribute_flat(mut self, attr: crate::types::Attribute, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::AttributeFlat { attr, amount });
        self
    }

    pub fn attribute_percent(mut self, attr: crate::types::Attribute, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::AttributePercent { attr, amount });
        self
    }

    pub fn rating_flat(mut self, rating: crate::types::RatingType, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::RatingFlat { rating, amount });
        self
    }

    pub fn damage_multiplier(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DamageMultiplier { amount, school: None });
        self
    }

    pub fn school_damage(mut self, school: DamageSchool, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DamageMultiplier { amount, school: Some(school) });
        self
    }

    pub fn haste(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DerivedPercent {
            stat: DerivedStat::Haste,
            amount,
        });
        self
    }

    pub fn crit(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DerivedPercent {
            stat: DerivedStat::CritChance,
            amount,
        });
        self
    }

    pub fn periodic_damage(mut self, tick_interval_secs: f32, ap_coef: f32) -> Self {
        let mut periodic = PeriodicEffect::new(self.aura.id, SimTime::from_secs_f32(tick_interval_secs));
        periodic = periodic.with_ap_scaling(ap_coef);
        self.aura.periodic = Some(periodic);
        self.aura.flags.is_periodic = true;
        self
    }

    pub fn build(self) -> AuraDef {
        self.aura
    }
}
