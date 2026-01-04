# Phase 08: Actors

## Goal

Create actor types: Player, Pet, Enemy.

## Prerequisites

Phase 07 complete. `cargo test -p engine_new` passes (78 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod actor;
└── actor/
    ├── mod.rs
    ├── player.rs
    ├── pet.rs
    └── enemy.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
pub mod resource;
pub mod combat;
pub mod aura;
pub mod proc;
pub mod actor;
```

### `src/actor/mod.rs`

```rust
mod player;
mod pet;
mod enemy;

pub use player::*;
pub use pet::*;
pub use enemy::*;

#[cfg(test)]
mod tests;
```

### `src/actor/player.rs`

```rust
use crate::types::{SpecId, UnitIdx, SimTime};
use crate::stats::StatCache;
use crate::resource::UnitResources;
use crate::combat::{Cooldown, ChargedCooldown};
use crate::aura::TargetAuras;
use crate::proc::ProcRegistry;

/// Player state during simulation
#[derive(Clone, Debug)]
pub struct Player {
    /// Player ID (usually 0)
    pub id: UnitIdx,
    /// Spec being simulated
    pub spec: SpecId,
    /// Stat cache
    pub stats: StatCache,
    /// Resource pools
    pub resources: UnitResources,
    /// Active buffs
    pub buffs: TargetAuras,
    /// Cooldowns
    cooldowns: Vec<Cooldown>,
    /// Charged cooldowns
    charged_cooldowns: Vec<ChargedCooldown>,
    /// Proc registry
    pub procs: ProcRegistry,
    /// Current GCD end time
    pub gcd_end: SimTime,
    /// Current cast end time (if casting)
    pub cast_end: Option<SimTime>,
    /// Current channel end time (if channeling)
    pub channel_end: Option<SimTime>,
    /// Next auto-attack time (main hand)
    pub next_auto_mh: SimTime,
    /// Next auto-attack time (off hand)
    pub next_auto_oh: Option<SimTime>,
    /// Whether player is moving
    pub is_moving: bool,
}

impl Player {
    pub fn new(spec: SpecId) -> Self {
        Self {
            id: UnitIdx(0),
            spec,
            stats: StatCache::new(),
            resources: UnitResources::new(),
            buffs: TargetAuras::new(),
            cooldowns: Vec::new(),
            charged_cooldowns: Vec::new(),
            procs: ProcRegistry::new(),
            gcd_end: SimTime::ZERO,
            cast_end: None,
            channel_end: None,
            next_auto_mh: SimTime::ZERO,
            next_auto_oh: None,
            is_moving: false,
        }
    }

    /// Reset for new iteration
    pub fn reset(&mut self) {
        self.buffs = TargetAuras::new();
        self.gcd_end = SimTime::ZERO;
        self.cast_end = None;
        self.channel_end = None;
        self.next_auto_mh = SimTime::ZERO;
        self.next_auto_oh = None;
        self.is_moving = false;

        for cd in &mut self.cooldowns {
            cd.reset();
        }
        for cd in &mut self.charged_cooldowns {
            cd.reset();
        }

        self.procs.reset();

        // Reset resources to starting values
        if let Some(ref mut primary) = self.resources.primary {
            primary.current = primary.max;
        }
        if let Some(ref mut secondary) = self.resources.secondary {
            secondary.current = 0.0;
        }
    }

    /// Register a cooldown
    pub fn add_cooldown(&mut self, cooldown: Cooldown) {
        self.cooldowns.push(cooldown);
    }

    /// Register a charged cooldown
    pub fn add_charged_cooldown(&mut self, cooldown: ChargedCooldown) {
        self.charged_cooldowns.push(cooldown);
    }

    /// Get cooldown by spell ID
    pub fn cooldown(&self, spell: crate::types::SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.iter().find(|cd| cd.spell == spell)
    }

    /// Get mutable cooldown by spell ID
    pub fn cooldown_mut(&mut self, spell: crate::types::SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.iter_mut().find(|cd| cd.spell == spell)
    }

    /// Get charged cooldown by spell ID
    pub fn charged_cooldown(&self, spell: crate::types::SpellIdx) -> Option<&ChargedCooldown> {
        self.charged_cooldowns.iter().find(|cd| cd.spell == spell)
    }

    /// Get mutable charged cooldown by spell ID
    pub fn charged_cooldown_mut(&mut self, spell: crate::types::SpellIdx) -> Option<&mut ChargedCooldown> {
        self.charged_cooldowns.iter_mut().find(|cd| cd.spell == spell)
    }

    /// Is on GCD?
    #[inline]
    pub fn on_gcd(&self, now: SimTime) -> bool {
        now < self.gcd_end
    }

    /// GCD remaining
    #[inline]
    pub fn gcd_remaining(&self, now: SimTime) -> SimTime {
        if now >= self.gcd_end {
            SimTime::ZERO
        } else {
            self.gcd_end - now
        }
    }

    /// Is casting?
    #[inline]
    pub fn is_casting(&self, now: SimTime) -> bool {
        self.cast_end.map(|end| now < end).unwrap_or(false)
    }

    /// Is channeling?
    #[inline]
    pub fn is_channeling(&self, now: SimTime) -> bool {
        self.channel_end.map(|end| now < end).unwrap_or(false)
    }

    /// Can cast (not on GCD, not casting, not channeling)
    pub fn can_cast(&self, now: SimTime) -> bool {
        !self.on_gcd(now) && !self.is_casting(now) && !self.is_channeling(now)
    }

    /// Start GCD
    pub fn start_gcd(&mut self, duration: SimTime, now: SimTime) {
        self.gcd_end = now + duration;
    }

    /// Start cast
    pub fn start_cast(&mut self, duration: SimTime, now: SimTime) {
        self.cast_end = Some(now + duration);
    }

    /// Cancel cast
    pub fn cancel_cast(&mut self) {
        self.cast_end = None;
    }

    /// Start channel
    pub fn start_channel(&mut self, duration: SimTime, now: SimTime) {
        self.channel_end = Some(now + duration);
    }

    /// Cancel channel
    pub fn cancel_channel(&mut self) {
        self.channel_end = None;
    }

    /// Get auto-attack speed (affected by haste)
    pub fn auto_attack_speed(&self, base_speed: SimTime) -> SimTime {
        let haste = self.stats.get_haste();
        let ms = (base_speed.as_millis() as f32 / haste) as u32;
        SimTime::from_millis(ms.max(1))
    }

    /// Schedule next auto-attack
    pub fn schedule_auto(&mut self, now: SimTime, base_speed: SimTime, is_offhand: bool) {
        let speed = self.auto_attack_speed(base_speed);
        if is_offhand {
            self.next_auto_oh = Some(now + speed);
        } else {
            self.next_auto_mh = now + speed;
        }
    }
}

/// Builder for configuring a Player
pub struct PlayerBuilder {
    player: Player,
}

impl PlayerBuilder {
    pub fn new(spec: SpecId) -> Self {
        Self { player: Player::new(spec) }
    }

    pub fn with_stats(mut self, stats: StatCache) -> Self {
        self.player.stats = stats;
        self
    }

    pub fn with_resources(mut self, resources: UnitResources) -> Self {
        self.player.resources = resources;
        self
    }

    pub fn with_dual_wield(mut self) -> Self {
        self.player.next_auto_oh = Some(SimTime::ZERO);
        self
    }

    pub fn build(self) -> Player {
        self.player
    }
}
```

### `src/actor/pet.rs`

```rust
use crate::types::{UnitIdx, SimTime};
use crate::stats::StatCache;
use crate::aura::TargetAuras;
use crate::combat::Cooldown;

/// Pet type
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PetType {
    /// Permanent pet (Hunter pet, Warlock demon)
    Permanent,
    /// Temporary summon (totems, guardians)
    Guardian,
    /// Short-lived summon
    Summon,
}

/// Pet state during simulation
#[derive(Clone, Debug)]
pub struct Pet {
    /// Pet ID
    pub id: UnitIdx,
    /// Owner ID
    pub owner: UnitIdx,
    /// Pet type
    pub pet_type: PetType,
    /// Pet name (for display)
    pub name: &'static str,
    /// Stats (inherit from owner with scaling)
    pub stats: StatCache,
    /// Active buffs
    pub buffs: TargetAuras,
    /// Cooldowns
    cooldowns: Vec<Cooldown>,
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
    pub fn new(id: UnitIdx, owner: UnitIdx, pet_type: PetType, name: &'static str) -> Self {
        Self {
            id,
            owner,
            pet_type,
            name,
            stats: StatCache::new(),
            buffs: TargetAuras::new(),
            cooldowns: Vec::new(),
            next_auto: SimTime::ZERO,
            is_active: true,
            expires_at: None,
            target: None,
        }
    }

    /// Create a temporary pet
    pub fn temporary(id: UnitIdx, owner: UnitIdx, name: &'static str, duration: SimTime, now: SimTime) -> Self {
        let mut pet = Self::new(id, owner, PetType::Summon, name);
        pet.expires_at = Some(now + duration);
        pet
    }

    /// Reset for new iteration
    pub fn reset(&mut self) {
        self.buffs = TargetAuras::new();
        self.next_auto = SimTime::ZERO;
        self.is_active = true;
        self.target = None;

        for cd in &mut self.cooldowns {
            cd.reset();
        }
    }

    /// Update pet with owner stats
    pub fn inherit_stats(&mut self, owner: &StatCache, inheritance: f32) {
        // Pets typically inherit a percentage of owner's stats
        self.stats.set_attack_power(owner.get_attack_power() * inheritance);
        self.stats.set_spell_power(owner.get_spell_power() * inheritance);
        self.stats.set_haste_rating(owner.get_stat(crate::stats::Stat::HasteRating) as i32);
        self.stats.set_crit_rating(owner.get_stat(crate::stats::Stat::CritRating) as i32);
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

    /// Add cooldown
    pub fn add_cooldown(&mut self, cooldown: Cooldown) {
        self.cooldowns.push(cooldown);
    }

    /// Get cooldown
    pub fn cooldown(&self, spell: crate::types::SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.iter().find(|cd| cd.spell == spell)
    }

    /// Get mutable cooldown
    pub fn cooldown_mut(&mut self, spell: crate::types::SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.iter_mut().find(|cd| cd.spell == spell)
    }

    /// Get auto-attack speed
    pub fn auto_attack_speed(&self, base_speed: SimTime) -> SimTime {
        let haste = self.stats.get_haste();
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
    next_id: u8,
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
        self.pets.retain(|p| p.pet_type == PetType::Permanent);
        for pet in &mut self.pets {
            pet.reset();
        }
    }

    /// Summon a new pet
    pub fn summon(&mut self, owner: UnitIdx, pet_type: PetType, name: &'static str) -> UnitIdx {
        let id = UnitIdx(self.next_id);
        self.next_id += 1;

        let pet = Pet::new(id, owner, pet_type, name);
        self.pets.push(pet);

        id
    }

    /// Summon a temporary pet
    pub fn summon_temporary(
        &mut self,
        owner: UnitIdx,
        name: &'static str,
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
        self.pets.retain(|p| p.is_valid(now) || p.pet_type == PetType::Permanent);
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
```

### `src/actor/enemy.rs`

```rust
use crate::types::{TargetIdx, SimTime};
use crate::aura::TargetAuras;

/// Enemy state
#[derive(Clone, Debug)]
pub struct Enemy {
    /// Target index
    pub id: TargetIdx,
    /// Enemy name
    pub name: String,
    /// Max health
    pub max_health: f32,
    /// Current health
    pub current_health: f32,
    /// Armor value
    pub armor: f32,
    /// Boss-level (3 levels above player)
    pub is_boss: bool,
    /// Active debuffs
    pub debuffs: TargetAuras,
    /// When enemy dies (for fixed-health scenarios)
    pub dies_at: Option<SimTime>,
}

impl Enemy {
    pub fn new(id: TargetIdx, name: impl Into<String>) -> Self {
        Self {
            id,
            name: name.into(),
            max_health: 10_000_000.0, // Default raid boss health
            current_health: 10_000_000.0,
            armor: 11300.0, // Boss armor
            is_boss: true,
            debuffs: TargetAuras::new(),
            dies_at: None,
        }
    }

    /// Create a raid boss
    pub fn raid_boss(id: TargetIdx, name: impl Into<String>) -> Self {
        Self::new(id, name)
    }

    /// Create a dungeon boss
    pub fn dungeon_boss(id: TargetIdx, name: impl Into<String>) -> Self {
        let mut enemy = Self::new(id, name);
        enemy.max_health = 2_000_000.0;
        enemy.current_health = 2_000_000.0;
        enemy
    }

    /// Create a trash mob
    pub fn trash(id: TargetIdx) -> Self {
        let mut enemy = Self::new(id, "Trash");
        enemy.max_health = 500_000.0;
        enemy.current_health = 500_000.0;
        enemy.is_boss = false;
        enemy
    }

    /// Reset for new iteration
    pub fn reset(&mut self) {
        self.current_health = self.max_health;
        self.debuffs = TargetAuras::new();
    }

    /// Health percentage
    #[inline]
    pub fn health_percent(&self) -> f32 {
        self.current_health / self.max_health
    }

    /// Is alive
    #[inline]
    pub fn is_alive(&self) -> bool {
        self.current_health > 0.0
    }

    /// Is below health threshold
    #[inline]
    pub fn is_below(&self, percent: f32) -> bool {
        self.health_percent() < percent
    }

    /// Take damage
    pub fn take_damage(&mut self, amount: f32) {
        self.current_health = (self.current_health - amount).max(0.0);
    }

    /// Calculate armor mitigation
    pub fn armor_mitigation(&self, attacker_level: u8) -> f32 {
        // Armor formula for level 70+
        let k = if self.is_boss {
            // Boss armor constant (higher for bosses)
            (attacker_level as f32) * 467.5 + 16593.0
        } else {
            (attacker_level as f32) * 467.5
        };

        // Mitigation = armor / (armor + k)
        self.armor / (self.armor + k)
    }

    /// Time to die (if health-based execution)
    pub fn time_to_die(&self, dps: f32) -> SimTime {
        if dps <= 0.0 {
            return SimTime::MAX;
        }
        let seconds = self.current_health / dps;
        SimTime::from_secs_f32(seconds)
    }
}

/// Container for all enemies
#[derive(Clone, Debug, Default)]
pub struct EnemyManager {
    enemies: Vec<Enemy>,
    /// Primary target index
    pub primary: TargetIdx,
}

impl EnemyManager {
    pub fn new() -> Self {
        Self {
            enemies: Vec::new(),
            primary: TargetIdx(0),
        }
    }

    /// Create with specified number of raid bosses
    pub fn with_bosses(count: usize) -> Self {
        let mut manager = Self::new();
        for i in 0..count {
            manager.enemies.push(Enemy::raid_boss(
                TargetIdx(i as u8),
                format!("Boss {}", i + 1),
            ));
        }
        manager
    }

    /// Add enemy
    pub fn add(&mut self, enemy: Enemy) {
        self.enemies.push(enemy);
    }

    /// Get enemy by ID
    pub fn get(&self, id: TargetIdx) -> Option<&Enemy> {
        self.enemies.get(id.0 as usize)
    }

    /// Get mutable enemy by ID
    pub fn get_mut(&mut self, id: TargetIdx) -> Option<&mut Enemy> {
        self.enemies.get_mut(id.0 as usize)
    }

    /// Get primary target
    pub fn primary(&self) -> Option<&Enemy> {
        self.get(self.primary)
    }

    /// Get mutable primary target
    pub fn primary_mut(&mut self) -> Option<&mut Enemy> {
        self.get_mut(self.primary)
    }

    /// Reset all enemies
    pub fn reset(&mut self) {
        for enemy in &mut self.enemies {
            enemy.reset();
        }
    }

    /// Count of alive enemies
    pub fn alive_count(&self) -> usize {
        self.enemies.iter().filter(|e| e.is_alive()).count()
    }

    /// All alive enemies
    pub fn alive(&self) -> impl Iterator<Item = &Enemy> {
        self.enemies.iter().filter(|e| e.is_alive())
    }

    /// All alive enemies mutably
    pub fn alive_mut(&mut self) -> impl Iterator<Item = &mut Enemy> {
        self.enemies.iter_mut().filter(|e| e.is_alive())
    }

    /// Total enemy count
    pub fn count(&self) -> usize {
        self.enemies.len()
    }

    /// Average health percent of alive enemies
    pub fn average_health_percent(&self) -> f32 {
        let alive: Vec<_> = self.alive().collect();
        if alive.is_empty() {
            return 0.0;
        }
        let total: f32 = alive.iter().map(|e| e.health_percent()).sum();
        total / alive.len() as f32
    }
}
```

### `src/actor/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::stats::StatCache;
use crate::resource::{UnitResources, ResourcePool};

#[test]
fn player_basic() {
    let player = Player::new(SpecId::BeastMastery);
    assert_eq!(player.id, UnitIdx(0));
    assert_eq!(player.spec, SpecId::BeastMastery);
}

#[test]
fn player_gcd() {
    let mut player = Player::new(SpecId::BeastMastery);
    let now = SimTime::ZERO;

    assert!(!player.on_gcd(now));
    assert!(player.can_cast(now));

    player.start_gcd(SimTime::from_millis(1500), now);

    assert!(player.on_gcd(now));
    assert!(!player.can_cast(now));
    assert!(!player.on_gcd(SimTime::from_millis(1500)));
}

#[test]
fn player_casting() {
    let mut player = Player::new(SpecId::BeastMastery);
    let now = SimTime::ZERO;

    player.start_cast(SimTime::from_secs(2), now);

    assert!(player.is_casting(now));
    assert!(!player.can_cast(now));
    assert!(!player.is_casting(SimTime::from_secs(3)));
}

#[test]
fn player_auto_attack() {
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.set_haste_rating(0); // No haste

    let base_speed = SimTime::from_millis(2600); // 2.6s base
    let speed = player.auto_attack_speed(base_speed);

    assert_eq!(speed.as_millis(), 2600);

    // With 30% haste
    player.stats.set_haste_rating(1050); // ~30% at level 80
    let hasted_speed = player.auto_attack_speed(base_speed);

    assert!(hasted_speed.as_millis() < 2600);
}

#[test]
fn player_builder() {
    let player = PlayerBuilder::new(SpecId::BeastMastery)
        .with_dual_wield()
        .build();

    assert!(player.next_auto_oh.is_some());
}

#[test]
fn pet_basic() {
    let pet = Pet::new(UnitIdx(1), UnitIdx(0), PetType::Permanent, "Wolf");

    assert_eq!(pet.id, UnitIdx(1));
    assert_eq!(pet.owner, UnitIdx(0));
    assert!(pet.is_active);
}

#[test]
fn pet_temporary() {
    let now = SimTime::ZERO;
    let pet = Pet::temporary(UnitIdx(1), UnitIdx(0), "Spirit Beast", SimTime::from_secs(15), now);

    assert!(pet.is_valid(now));
    assert!(pet.is_valid(SimTime::from_secs(10)));
    assert!(!pet.is_valid(SimTime::from_secs(20)));
}

#[test]
fn pet_manager_summon() {
    let mut manager = PetManager::new();

    let pet1 = manager.summon(UnitIdx(0), PetType::Permanent, "Wolf");
    let pet2 = manager.summon(UnitIdx(0), PetType::Guardian, "Spirit Beast");

    assert_eq!(pet1, UnitIdx(1));
    assert_eq!(pet2, UnitIdx(2));
    assert_eq!(manager.active_count(SimTime::ZERO), 2);
}

#[test]
fn pet_manager_cleanup() {
    let mut manager = PetManager::new();
    let now = SimTime::ZERO;

    manager.summon(UnitIdx(0), PetType::Permanent, "Wolf");
    manager.summon_temporary(UnitIdx(0), "Spirit", SimTime::from_secs(5), now);

    assert_eq!(manager.active_count(now), 2);

    // After 10 seconds, temporary should be gone
    manager.cleanup(SimTime::from_secs(10));
    assert_eq!(manager.active_count(SimTime::from_secs(10)), 1);
}

#[test]
fn enemy_basic() {
    let enemy = Enemy::raid_boss(TargetIdx(0), "Ragnaros");

    assert!(enemy.is_alive());
    assert!((enemy.health_percent() - 1.0).abs() < 0.01);
}

#[test]
fn enemy_take_damage() {
    let mut enemy = Enemy::new(TargetIdx(0), "Boss");
    enemy.max_health = 1_000_000.0;
    enemy.current_health = 1_000_000.0;

    enemy.take_damage(200_000.0);

    assert!((enemy.health_percent() - 0.8).abs() < 0.01);
    assert!(enemy.is_below(0.85));
    assert!(!enemy.is_below(0.75));
}

#[test]
fn enemy_armor_mitigation() {
    let enemy = Enemy::raid_boss(TargetIdx(0), "Boss");

    let mitigation = enemy.armor_mitigation(80);

    // Should be roughly 25-35% for boss armor
    assert!(mitigation > 0.2 && mitigation < 0.5);
}

#[test]
fn enemy_manager_basic() {
    let manager = EnemyManager::with_bosses(3);

    assert_eq!(manager.count(), 3);
    assert_eq!(manager.alive_count(), 3);
}

#[test]
fn enemy_manager_deaths() {
    let mut manager = EnemyManager::with_bosses(3);

    // Kill one
    if let Some(enemy) = manager.get_mut(TargetIdx(1)) {
        enemy.current_health = 0.0;
    }

    assert_eq!(manager.alive_count(), 2);
}

#[test]
fn enemy_time_to_die() {
    let mut enemy = Enemy::new(TargetIdx(0), "Boss");
    enemy.max_health = 1_000_000.0;
    enemy.current_health = 500_000.0;

    let ttd = enemy.time_to_die(10_000.0); // 10k DPS
    assert!((ttd.as_secs_f32() - 50.0).abs() < 0.1);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (78 + 15 = 93 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod actor;`
- [ ] Create `src/actor/mod.rs`
- [ ] Create `src/actor/player.rs`
- [ ] Create `src/actor/pet.rs`
- [ ] Create `src/actor/enemy.rs`
- [ ] Create `src/actor/tests.rs`
- [ ] Run `cargo test` — 93 tests pass
