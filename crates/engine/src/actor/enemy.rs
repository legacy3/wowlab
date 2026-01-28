use crate::aura::TargetAuras;
use wowlab_common::types::{SimTime, TargetIdx};

#[derive(Clone, Debug)]
pub struct Enemy {
    pub id: TargetIdx,
    pub name: String,
    pub max_health: f32,
    pub current_health: f32,
    pub armor: f32,
    pub is_boss: bool,
    pub debuffs: TargetAuras,
    pub dies_at: Option<SimTime>,
    pub distance: f32,
    pub is_casting: bool,
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
            distance: 5.0,
            is_casting: false,
            is_moving: false,
        }
    }

    pub fn raid_boss(id: TargetIdx, name: impl Into<String>) -> Self {
        Self::new(id, name)
    }

    pub fn dungeon_boss(id: TargetIdx, name: impl Into<String>) -> Self {
        let mut enemy = Self::new(id, name);
        enemy.max_health = 2_000_000.0;
        enemy.current_health = 2_000_000.0;
        enemy
    }

    pub fn trash(id: TargetIdx) -> Self {
        let mut enemy = Self::new(id, "Trash");
        enemy.max_health = 500_000.0;
        enemy.current_health = 500_000.0;
        enemy.is_boss = false;
        enemy
    }

    pub fn reset(&mut self) {
        self.current_health = self.max_health;
        self.debuffs = TargetAuras::new();
        self.is_casting = false;
        self.is_moving = false;
    }

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

    #[inline]
    pub fn health_percent(&self) -> f32 {
        self.current_health / self.max_health
    }

    #[inline]
    pub fn is_alive(&self) -> bool {
        self.current_health > 0.0
    }

    #[inline]
    pub fn is_below(&self, percent: f32) -> bool {
        self.health_percent() < percent
    }

    pub fn take_damage(&mut self, amount: f32) {
        self.current_health = (self.current_health - amount).max(0.0);
    }

    pub fn armor_mitigation(&self, attacker_level: u8) -> f32 {
        let k = if self.is_boss {
            (attacker_level as f32) * 467.5 + 16593.0
        } else {
            (attacker_level as f32) * 467.5
        };
        self.armor / (self.armor + k)
    }

    pub fn time_to_die(&self, dps: f32) -> SimTime {
        if dps <= 0.0 {
            return SimTime::MAX;
        }
        let seconds = self.current_health / dps;
        SimTime::from_secs_f32(seconds)
    }
}

#[derive(Clone, Debug, Default)]
pub struct EnemyManager {
    enemies: Vec<Enemy>,
    pub primary: TargetIdx,
}

impl EnemyManager {
    pub fn new() -> Self {
        Self {
            enemies: Vec::new(),
            primary: TargetIdx(0),
        }
    }

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

    pub fn add(&mut self, enemy: Enemy) {
        self.enemies.push(enemy);
    }

    pub fn get(&self, id: TargetIdx) -> Option<&Enemy> {
        self.enemies.get(id.0 as usize)
    }

    pub fn get_mut(&mut self, id: TargetIdx) -> Option<&mut Enemy> {
        self.enemies.get_mut(id.0 as usize)
    }

    pub fn primary(&self) -> Option<&Enemy> {
        self.get(self.primary)
    }

    pub fn primary_mut(&mut self) -> Option<&mut Enemy> {
        self.get_mut(self.primary)
    }

    pub fn reset(&mut self) {
        for enemy in &mut self.enemies {
            enemy.reset();
        }
    }

    pub fn alive_count(&self) -> usize {
        self.enemies.iter().filter(|e| e.is_alive()).count()
    }

    pub fn alive(&self) -> impl Iterator<Item = &Enemy> {
        self.enemies.iter().filter(|e| e.is_alive())
    }

    pub fn alive_mut(&mut self) -> impl Iterator<Item = &mut Enemy> {
        self.enemies.iter_mut().filter(|e| e.is_alive())
    }

    pub fn count(&self) -> usize {
        self.enemies.len()
    }

    pub fn average_health_percent(&self) -> f32 {
        let alive: Vec<_> = self.alive().collect();
        if alive.is_empty() {
            return 0.0;
        }
        let total: f32 = alive.iter().map(|e| e.health_percent()).sum();
        total / alive.len() as f32
    }
}
