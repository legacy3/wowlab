use crate::aura::TargetAuras;
use crate::combat::Cooldown;
use crate::stats::StatCache;
use std::collections::HashMap;
use wowlab_common::types::{PetKind, SimTime, SpellIdx, UnitIdx};

#[derive(Clone, Debug)]
pub struct Pet {
    pub id: UnitIdx,
    pub owner: UnitIdx,
    pub pet_kind: PetKind,
    pub name: String,
    pub stats: StatCache,
    pub buffs: TargetAuras,
    pub cooldowns: HashMap<SpellIdx, Cooldown>,
    pub next_auto: SimTime,
    pub is_active: bool,
    pub expires_at: Option<SimTime>,
    pub target: Option<wowlab_common::types::TargetIdx>,
}

impl Pet {
    pub fn new(id: UnitIdx, owner: UnitIdx, pet_kind: PetKind, name: impl Into<String>) -> Self {
        Self {
            id,
            owner,
            pet_kind,
            name: name.into(),
            stats: StatCache::new(),
            buffs: TargetAuras::new(),
            cooldowns: HashMap::new(),
            next_auto: SimTime::ZERO,
            is_active: true,
            expires_at: None,
            target: None,
        }
    }

    pub fn temporary(
        id: UnitIdx,
        owner: UnitIdx,
        name: impl Into<String>,
        duration: SimTime,
        now: SimTime,
    ) -> Self {
        let mut pet = Self::new(id, owner, PetKind::Summon, name);
        pet.expires_at = Some(now + duration);
        pet
    }

    pub fn reset(&mut self) {
        self.buffs = TargetAuras::new();
        self.next_auto = SimTime::ZERO;
        self.is_active = true;
        self.target = None;

        for cd in self.cooldowns.values_mut() {
            cd.reset();
        }
    }

    pub fn inherit_stats(&mut self, owner: &StatCache, inheritance: f32) {
        self.stats.combat.attack_power = owner.combat.attack_power * inheritance;
        self.stats.combat.spell_power = owner.combat.spell_power * inheritance;
        self.stats.ratings.haste = owner.ratings.haste;
        self.stats.ratings.crit = owner.ratings.crit;
        self.stats.invalidate();
    }

    pub fn is_valid(&self, now: SimTime) -> bool {
        if !self.is_active {
            return false;
        }
        if let Some(expires) = self.expires_at {
            now < expires
        } else {
            true
        }
    }

    pub fn add_cooldown(&mut self, spell: SpellIdx, cooldown: Cooldown) {
        self.cooldowns.insert(spell, cooldown);
    }

    pub fn cooldown(&self, spell: SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.get(&spell)
    }

    pub fn cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.get_mut(&spell)
    }

    pub fn auto_attack_speed(&self, base_speed: SimTime) -> SimTime {
        let haste = self.stats.combat.haste;
        let ms = (base_speed.as_millis() as f32 / haste) as u32;
        SimTime::from_millis(ms.max(1))
    }

    pub fn schedule_auto(&mut self, now: SimTime, base_speed: SimTime) {
        let speed = self.auto_attack_speed(base_speed);
        self.next_auto = now + speed;
    }
}

#[derive(Clone, Debug, Default)]
pub struct PetManager {
    pets: Vec<Pet>,
    next_id: u16,
}

impl PetManager {
    pub fn new() -> Self {
        Self {
            pets: Vec::new(),
            next_id: 1,
        }
    }

    pub fn reset(&mut self) {
        self.pets.retain(|p| p.pet_kind == PetKind::Permanent);
        for pet in &mut self.pets {
            pet.reset();
        }
    }

    pub fn summon(
        &mut self,
        owner: UnitIdx,
        pet_kind: PetKind,
        name: impl Into<String>,
    ) -> UnitIdx {
        let id = UnitIdx(self.next_id);
        self.next_id += 1;

        let pet = Pet::new(id, owner, pet_kind, name);
        self.pets.push(pet);

        id
    }

    pub fn summon_temporary(
        &mut self,
        owner: UnitIdx,
        name: impl Into<String>,
        duration: SimTime,
        now: SimTime,
    ) -> UnitIdx {
        let id = UnitIdx(self.next_id);
        self.next_id += 1;

        let pet = Pet::temporary(id, owner, name, duration, now);
        self.pets.push(pet);

        id
    }

    pub fn get(&self, id: UnitIdx) -> Option<&Pet> {
        self.pets.iter().find(|p| p.id == id)
    }

    pub fn get_mut(&mut self, id: UnitIdx) -> Option<&mut Pet> {
        self.pets.iter_mut().find(|p| p.id == id)
    }

    pub fn active(&self, now: SimTime) -> impl Iterator<Item = &Pet> {
        self.pets.iter().filter(move |p| p.is_valid(now))
    }

    pub fn active_mut(&mut self, now: SimTime) -> impl Iterator<Item = &mut Pet> {
        self.pets.iter_mut().filter(move |p| p.is_valid(now))
    }

    pub fn cleanup(&mut self, now: SimTime) {
        self.pets
            .retain(|p| p.is_valid(now) || p.pet_kind == PetKind::Permanent);
    }

    pub fn dismiss(&mut self, id: UnitIdx) {
        if let Some(pet) = self.get_mut(id) {
            pet.is_active = false;
        }
    }

    pub fn active_count(&self, now: SimTime) -> usize {
        self.pets.iter().filter(|p| p.is_valid(now)).count()
    }
}
