use crate::aura::TargetAuras;
use crate::combat::Cooldown;
use crate::stats::StatCache;
use crate::types::{PetKind, SimTime, SpellIdx, UnitIdx};
use std::collections::HashMap;

/// Pet state during simulation
#[derive(Clone, Debug)]
pub struct Pet {
    /// Pet ID
    pub id: UnitIdx,
    /// Owner ID
    pub owner: UnitIdx,
    /// Pet kind
    pub pet_kind: PetKind,
    /// Pet name (for display)
    pub name: String,
    /// Stats (inherit from owner with scaling)
    pub stats: StatCache,
    /// Active buffs
    pub buffs: TargetAuras,
    /// Cooldowns by spell
    pub cooldowns: HashMap<SpellIdx, Cooldown>,
    /// Next auto-attack time
    pub next_auto: SimTime,
    /// Is pet active
    pub is_active: bool,
    /// When pet expires (for temporary pets)
    pub expires_at: Option<SimTime>,
    /// Current target
    pub target: Option<crate::types::TargetIdx>,
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

    /// Create a temporary pet
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

    /// Reset for new iteration
    pub fn reset(&mut self) {
        self.buffs = TargetAuras::new();
        self.next_auto = SimTime::ZERO;
        self.is_active = true;
        self.target = None;

        for cd in self.cooldowns.values_mut() {
            cd.reset();
        }
    }

    /// Update pet with owner stats
    pub fn inherit_stats(&mut self, owner: &StatCache, inheritance: f32) {
        // Pets typically inherit a percentage of owner's stats
        self.stats.combat.attack_power = owner.combat.attack_power * inheritance;
        self.stats.combat.spell_power = owner.combat.spell_power * inheritance;
        self.stats.ratings.haste = owner.ratings.haste;
        self.stats.ratings.crit = owner.ratings.crit;
        self.stats.invalidate();
    }

    /// Is pet still valid (active and not expired)
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

    /// Add cooldown for a spell
    pub fn add_cooldown(&mut self, spell: SpellIdx, cooldown: Cooldown) {
        self.cooldowns.insert(spell, cooldown);
    }

    /// Get cooldown
    pub fn cooldown(&self, spell: SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.get(&spell)
    }

    /// Get mutable cooldown
    pub fn cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.get_mut(&spell)
    }

    /// Get auto-attack speed
    pub fn auto_attack_speed(&self, base_speed: SimTime) -> SimTime {
        let haste = self.stats.combat.haste;
        let ms = (base_speed.as_millis() as f32 / haste) as u32;
        SimTime::from_millis(ms.max(1))
    }

    /// Schedule next auto
    pub fn schedule_auto(&mut self, now: SimTime, base_speed: SimTime) {
        let speed = self.auto_attack_speed(base_speed);
        self.next_auto = now + speed;
    }
}

/// Container for all pets
#[derive(Clone, Debug, Default)]
pub struct PetManager {
    pets: Vec<Pet>,
    next_id: u16,
}

impl PetManager {
    pub fn new() -> Self {
        Self {
            pets: Vec::new(),
            next_id: 1, // 0 is reserved for player
        }
    }

    /// Reset all pets
    pub fn reset(&mut self) {
        // Only keep permanent pets
        self.pets.retain(|p| p.pet_kind == PetKind::Permanent);
        for pet in &mut self.pets {
            pet.reset();
        }
    }

    /// Summon a new pet
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

    /// Summon a temporary pet
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

    /// Get pet by ID
    pub fn get(&self, id: UnitIdx) -> Option<&Pet> {
        self.pets.iter().find(|p| p.id == id)
    }

    /// Get mutable pet by ID
    pub fn get_mut(&mut self, id: UnitIdx) -> Option<&mut Pet> {
        self.pets.iter_mut().find(|p| p.id == id)
    }

    /// Get all active pets
    pub fn active(&self, now: SimTime) -> impl Iterator<Item = &Pet> {
        self.pets.iter().filter(move |p| p.is_valid(now))
    }

    /// Get all active pets mutably
    pub fn active_mut(&mut self, now: SimTime) -> impl Iterator<Item = &mut Pet> {
        self.pets.iter_mut().filter(move |p| p.is_valid(now))
    }

    /// Remove expired pets
    pub fn cleanup(&mut self, now: SimTime) {
        self.pets
            .retain(|p| p.is_valid(now) || p.pet_kind == PetKind::Permanent);
    }

    /// Dismiss pet
    pub fn dismiss(&mut self, id: UnitIdx) {
        if let Some(pet) = self.get_mut(id) {
            pet.is_active = false;
        }
    }

    /// Count of active pets
    pub fn active_count(&self, now: SimTime) -> usize {
        self.pets.iter().filter(|p| p.is_valid(now)).count()
    }
}
