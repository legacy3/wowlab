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
    /// Distance to target in yards
    pub distance: f32,
    /// Target is currently casting
    pub is_casting: bool,
    /// Target is currently moving
    pub is_moving: bool,
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
            distance: 5.0, // Default melee range
            is_casting: false,
            is_moving: false,
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
        self.is_casting = false;
        self.is_moving = false;
    }

    /// Calculate time to reach a specific health percentage
    pub fn time_to_percent(&self, percent: f32, dps: f32) -> SimTime {
        let target_health = self.max_health * (percent / 100.0);
        let damage_needed = self.current_health - target_health;
        if damage_needed <= 0.0 {
            return SimTime::ZERO;
        }
        if dps <= 0.0 {
            return SimTime::MAX;
        }
        let seconds = damage_needed / dps;
        SimTime::from_secs_f32(seconds)
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
                TargetIdx(i as u16),
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
