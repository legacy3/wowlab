use crate::aura::TargetAuras;
use crate::combat::{ChargedCooldown, Cooldown};
use crate::proc::ProcRegistry;
use crate::resource::UnitResources;
use crate::stats::StatCache;
use ahash::AHashMap;
use wowlab_common::types::{SimTime, SpecId, SpellIdx, UnitIdx};

#[derive(Clone, Debug)]
pub struct Player {
    pub id: UnitIdx,
    pub spec: SpecId,
    pub stats: StatCache,
    pub resources: UnitResources,
    pub buffs: TargetAuras,
    pub cooldowns: AHashMap<SpellIdx, Cooldown>,
    pub charged_cooldowns: AHashMap<SpellIdx, ChargedCooldown>,
    pub procs: ProcRegistry,
    pub gcd_end: SimTime,
    pub cast_end: Option<SimTime>,
    pub channel_end: Option<SimTime>,
    pub next_auto_mh: SimTime,
    pub next_auto_oh: Option<SimTime>,
    pub is_moving: bool,
    pub health: f64,
    pub max_health: f64,
    pub level: u8,
    pub alive: bool,
    pub in_combat: bool,
    pub stealthed: bool,
    pub mounted: bool,
    pub movement_duration: f64,
}

pub const DEFAULT_MAX_HEALTH: f64 = 1_000_000.0;
pub const DEFAULT_LEVEL: u8 = 80;

impl Player {
    pub fn new(spec: SpecId) -> Self {
        Self {
            id: UnitIdx(0),
            spec,
            stats: StatCache::new(),
            resources: UnitResources::new(),
            buffs: TargetAuras::new(),
            cooldowns: AHashMap::new(),
            charged_cooldowns: AHashMap::new(),
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
            in_combat: true,
            stealthed: false,
            mounted: false,
            movement_duration: 0.0,
        }
    }

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

        if let Some(ref mut primary) = self.resources.primary {
            primary.current = primary.max;
        }
        if let Some(ref mut secondary) = self.resources.secondary {
            secondary.current = 0.0;
        }
    }

    pub fn add_cooldown(&mut self, spell: SpellIdx, cooldown: Cooldown) {
        self.cooldowns.insert(spell, cooldown);
    }

    pub fn add_charged_cooldown(&mut self, spell: SpellIdx, cooldown: ChargedCooldown) {
        self.charged_cooldowns.insert(spell, cooldown);
    }

    pub fn cooldown(&self, spell: SpellIdx) -> Option<&Cooldown> {
        self.cooldowns.get(&spell)
    }

    pub fn cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut Cooldown> {
        self.cooldowns.get_mut(&spell)
    }

    pub fn charged_cooldown(&self, spell: SpellIdx) -> Option<&ChargedCooldown> {
        self.charged_cooldowns.get(&spell)
    }

    pub fn charged_cooldown_mut(&mut self, spell: SpellIdx) -> Option<&mut ChargedCooldown> {
        self.charged_cooldowns.get_mut(&spell)
    }

    #[inline]
    pub fn on_gcd(&self, now: SimTime) -> bool {
        now < self.gcd_end
    }

    #[inline]
    pub fn gcd_remaining(&self, now: SimTime) -> SimTime {
        if now >= self.gcd_end {
            SimTime::ZERO
        } else {
            self.gcd_end - now
        }
    }

    #[inline]
    pub fn is_casting(&self, now: SimTime) -> bool {
        self.cast_end.map(|end| now < end).unwrap_or(false)
    }

    #[inline]
    pub fn is_channeling(&self, now: SimTime) -> bool {
        self.channel_end.map(|end| now < end).unwrap_or(false)
    }

    pub fn can_cast(&self, now: SimTime) -> bool {
        !self.on_gcd(now) && !self.is_casting(now) && !self.is_channeling(now)
    }

    pub fn start_gcd(&mut self, duration: SimTime, now: SimTime) {
        self.gcd_end = now + duration;
    }

    pub fn start_cast(&mut self, duration: SimTime, now: SimTime) {
        self.cast_end = Some(now + duration);
    }

    pub fn cancel_cast(&mut self) {
        self.cast_end = None;
    }

    pub fn start_channel(&mut self, duration: SimTime, now: SimTime) {
        self.channel_end = Some(now + duration);
    }

    pub fn cancel_channel(&mut self) {
        self.channel_end = None;
    }

    pub fn auto_attack_speed(&self, base_speed: SimTime) -> SimTime {
        let haste = self.stats.combat.haste;
        let ms = (base_speed.as_millis() as f32 / haste) as u32;
        SimTime::from_millis(ms.max(1))
    }

    pub fn schedule_auto(&mut self, now: SimTime, base_speed: SimTime, is_offhand: bool) {
        let speed = self.auto_attack_speed(base_speed);
        if is_offhand {
            self.next_auto_oh = Some(now + speed);
        } else {
            self.next_auto_mh = now + speed;
        }
    }

    pub fn can_cast_spell(
        &self,
        spell: SpellIdx,
        state: &crate::sim::SimState,
        now: SimTime,
    ) -> bool {
        if self.on_gcd(now) {
            return false;
        }

        if self.is_casting(now) || self.is_channeling(now) {
            return false;
        }

        if let Some(cd) = self.cooldown(spell) {
            if !cd.is_ready(now) {
                return false;
            }
        }

        if let Some(cd) = self.charged_cooldown(spell) {
            if cd.current_charges == 0 {
                return false;
            }
        }

        if let Some(enemy) = state.enemies.primary() {
            // TODO: get actual spell range from spell definitions
            let spell_range = 40.0;
            if enemy.distance > spell_range {
                return false;
            }
        }

        true
    }
}

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
