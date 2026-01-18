use crate::aura::TargetAuras;
use crate::combat::{ChargedCooldown, Cooldown};
use crate::proc::ProcRegistry;
use crate::resource::UnitResources;
use crate::stats::StatCache;
use wowlab_types::{SimTime, SpecId, SpellIdx, UnitIdx};
use std::collections::HashMap;

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
    /// Cooldowns by spell
    pub cooldowns: HashMap<SpellIdx, Cooldown>,
    /// Charged cooldowns by spell
    pub charged_cooldowns: HashMap<SpellIdx, ChargedCooldown>,
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
    /// Current health
    pub health: f64,
    /// Maximum health
    pub max_health: f64,
    /// Character level
    pub level: u8,
    /// Is the player alive
    pub alive: bool,
    /// Is the player in combat
    pub in_combat: bool,
    /// Is the player stealthed
    pub stealthed: bool,
    /// Is the player mounted
    pub mounted: bool,
    /// Remaining movement duration in seconds
    pub movement_duration: f64,
}

/// Default max health for players (typical end-game value)
pub const DEFAULT_MAX_HEALTH: f64 = 1_000_000.0;
/// Default player level
pub const DEFAULT_LEVEL: u8 = 80;

impl Player {
    pub fn new(spec: SpecId) -> Self {
        Self {
            id: UnitIdx(0),
            spec,
            stats: StatCache::new(),
            resources: UnitResources::new(),
            buffs: TargetAuras::new(),
            cooldowns: HashMap::new(),
            charged_cooldowns: HashMap::new(),
            procs: ProcRegistry::new(),
            gcd_end: SimTime::ZERO,
            cast_end: None,
            channel_end: None,
            next_auto_mh: SimTime::ZERO,
            next_auto_oh: None,
            is_moving: false,
            health: DEFAULT_MAX_HEALTH,
            max_health: DEFAULT_MAX_HEALTH,
            level: DEFAULT_LEVEL,
            alive: true,
            in_combat: true, // Simulation assumes combat
            stealthed: false,
            mounted: false,
            movement_duration: 0.0,
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
        self.health = self.max_health;
        self.alive = true;
        self.in_combat = true;
        self.stealthed = false;
        self.mounted = false;
        self.movement_duration = 0.0;

        for cd in self.cooldowns.values_mut() {
            cd.reset();
        }
        for cd in self.charged_cooldowns.values_mut() {
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

    /// Register a cooldown for a spell
    pub fn add_cooldown(&mut self, spell: SpellIdx, cooldown: Cooldown) {
        self.cooldowns.insert(spell, cooldown);
    }

    /// Register a charged cooldown for a spell
    pub fn add_charged_cooldown(&mut self, spell: SpellIdx, cooldown: ChargedCooldown) {
        self.charged_cooldowns.insert(spell, cooldown);
    }

    /// Get cooldown by spell ID
    pub fn cooldown(&self, spell: SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.get(&spell)
    }

    /// Get mutable cooldown by spell ID
    pub fn cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.get_mut(&spell)
    }

    /// Get charged cooldown by spell ID
    pub fn charged_cooldown(&self, spell: SpellIdx) -> Option<&ChargedCooldown> {
        self.charged_cooldowns.get(&spell)
    }

    /// Get mutable charged cooldown by spell ID
    pub fn charged_cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut ChargedCooldown> {
        self.charged_cooldowns.get_mut(&spell)
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
        let haste = self.stats.combat.haste;
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

    /// Check if a spell can be cast (cooldown ready, in range, not on GCD).
    ///
    /// This is a comprehensive check that combines:
    /// - Cooldown availability (regular or charged)
    /// - GCD availability
    /// - Target in range (using primary enemy distance)
    ///
    /// Note: Resource cost checking is not included here as it requires
    /// spell definition lookup which is handled at the spec level.
    pub fn can_cast_spell(
        &self,
        spell: SpellIdx,
        state: &crate::sim::SimState,
        now: SimTime,
    ) -> bool {
        // Check GCD
        if self.on_gcd(now) {
            return false;
        }

        // Check if casting or channeling
        if self.is_casting(now) || self.is_channeling(now) {
            return false;
        }

        // Check regular cooldown
        if let Some(cd) = self.cooldown(spell) {
            if !cd.is_ready(now) {
                return false;
            }
        }

        // Check charged cooldown (must have at least 1 charge)
        if let Some(cd) = self.charged_cooldown(spell) {
            if cd.current_charges == 0 {
                return false;
            }
        }

        // Check range (using primary enemy)
        if let Some(enemy) = state.enemies.primary() {
            // Default spell range is 40 yards
            // TODO: Get actual spell range from spell definitions
            let spell_range = 40.0;
            if enemy.distance > spell_range {
                return false;
            }
        }

        true
    }
}

/// Builder for configuring a Player
pub struct PlayerBuilder {
    player: Player,
}

impl PlayerBuilder {
    pub fn new(spec: SpecId) -> Self {
        Self {
            player: Player::new(spec),
        }
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
