use crate::config::{ResourceConfig, ResourceType, SimConfig, Stats};

use super::EventQueue;

/// Mutable simulation state
pub struct SimState {
    /// Current simulation time
    pub time: f32,

    /// Player state
    pub player: UnitState,

    /// Pet state (if any)
    pub pet: Option<UnitState>,

    /// Target state
    pub target: TargetState,

    /// Event queue
    pub events: EventQueue,

    /// Simulation duration
    pub duration: f32,

    /// Results accumulator
    pub results: SimResultsAccum,
}

/// Runtime state for a unit (player or pet)
pub struct UnitState {
    /// Current stats (base + modifiers)
    pub stats: Stats,

    /// Base stats (without modifiers)
    pub base_stats: Stats,

    /// Current resources
    pub resources: Resources,

    /// Spell cooldown/charge states (indexed by spell position)
    pub spell_states: Vec<SpellState>,

    /// Active auras
    pub auras: AuraTracker,

    /// GCD end time
    pub gcd_ready: f32,

    /// Current cast end time (0 if not casting)
    pub cast_end: f32,

    /// Spell being cast
    pub casting_spell: Option<u32>,
}

impl UnitState {
    pub fn new(stats: Stats, resources: ResourceConfig, spell_count: usize) -> Self {
        Self {
            stats,
            base_stats: stats,
            resources: Resources::new(resources),
            spell_states: vec![SpellState::default(); spell_count],
            auras: AuraTracker::new(),
            gcd_ready: 0.0,
            cast_end: 0.0,
            casting_spell: None,
        }
    }

    pub fn reset(&mut self) {
        self.stats = self.base_stats;
        self.resources.reset();
        for state in &mut self.spell_states {
            state.reset();
        }
        self.auras.clear();
        self.gcd_ready = 0.0;
        self.cast_end = 0.0;
        self.casting_spell = None;
    }
}

/// Runtime spell state
#[derive(Debug, Clone, Copy, Default)]
pub struct SpellState {
    /// Time when cooldown is ready
    pub cooldown_ready: f32,

    /// Current charges (for charge-based spells)
    pub charges: u8,

    /// Max charges (copied from SpellDef)
    pub max_charges: u8,
}

impl SpellState {
    pub fn reset(&mut self) {
        self.cooldown_ready = 0.0;
        self.charges = self.max_charges;
    }
}

/// Resource tracking
#[derive(Debug, Clone, Copy)]
pub struct Resources {
    pub current: f32,
    pub max: f32,
    pub regen_per_second: f32,
    pub resource_type: ResourceType,
}

impl Resources {
    pub fn new(config: ResourceConfig) -> Self {
        Self {
            current: config.initial,
            max: config.max,
            regen_per_second: config.regen_per_second,
            resource_type: config.resource_type,
        }
    }

    pub fn reset(&mut self) {
        self.current = self.max;
    }

    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            true
        } else {
            false
        }
    }

    pub fn gain(&mut self, amount: f32) {
        self.current = (self.current + amount).min(self.max);
    }

    pub fn regen(&mut self, elapsed: f32) {
        self.gain(self.regen_per_second * elapsed);
    }
}

/// Active aura tracking
pub struct AuraTracker {
    /// Active auras: (aura_id, instance)
    active: Vec<(u32, AuraInstance)>,
}

impl AuraTracker {
    pub fn new() -> Self {
        Self {
            active: Vec::with_capacity(32),
        }
    }

    pub fn clear(&mut self) {
        self.active.clear();
    }

    pub fn apply(&mut self, aura_id: u32, duration: f32, max_stacks: u8, current_time: f32) {
        if let Some((_, instance)) = self.active.iter_mut().find(|(id, _)| *id == aura_id) {
            // Refresh existing aura
            instance.expires = current_time + duration;
            instance.stacks = (instance.stacks + 1).min(max_stacks);
        } else {
            // Apply new aura
            self.active.push((
                aura_id,
                AuraInstance {
                    expires: current_time + duration,
                    stacks: 1,
                },
            ));
        }
    }

    pub fn remove(&mut self, aura_id: u32) {
        self.active.retain(|(id, _)| *id != aura_id);
    }

    pub fn has(&self, aura_id: u32) -> bool {
        self.active.iter().any(|(id, _)| *id == aura_id)
    }

    pub fn stacks(&self, aura_id: u32) -> u8 {
        self.active
            .iter()
            .find(|(id, _)| *id == aura_id)
            .map(|(_, i)| i.stacks)
            .unwrap_or(0)
    }

    pub fn remaining(&self, aura_id: u32, current_time: f32) -> f32 {
        self.active
            .iter()
            .find(|(id, _)| *id == aura_id)
            .map(|(_, i)| (i.expires - current_time).max(0.0))
            .unwrap_or(0.0)
    }

    pub fn iter(&self) -> impl Iterator<Item = (u32, &AuraInstance)> {
        self.active.iter().map(|(id, inst)| (*id, inst))
    }
}

#[derive(Debug, Clone, Copy)]
pub struct AuraInstance {
    pub expires: f32,
    pub stacks: u8,
}

/// Target state
pub struct TargetState {
    pub health: f32,
    pub max_health: f32,
    pub auras: AuraTracker,
}

impl TargetState {
    pub fn new(max_health: f32) -> Self {
        Self {
            health: max_health,
            max_health,
            auras: AuraTracker::new(),
        }
    }

    pub fn health_pct(&self) -> f32 {
        (self.health / self.max_health) * 100.0
    }

    pub fn reset(&mut self) {
        self.health = self.max_health;
        self.auras.clear();
    }
}

/// Results accumulator for current simulation
#[derive(Debug, Clone, Default)]
pub struct SimResultsAccum {
    pub total_damage: f64,
    pub cast_count: u32,
    pub spell_damage: Vec<(u32, f64, u32)>, // (spell_id, damage, casts)
}

impl SimResultsAccum {
    pub fn reset(&mut self) {
        self.total_damage = 0.0;
        self.cast_count = 0;
        self.spell_damage.clear();
    }

    pub fn record_damage(&mut self, spell_id: u32, damage: f64) {
        self.total_damage += damage;
        if let Some((_, total, casts)) = self
            .spell_damage
            .iter_mut()
            .find(|(id, _, _)| *id == spell_id)
        {
            *total += damage;
            *casts += 1;
        } else {
            self.spell_damage.push((spell_id, damage, 1));
        }
    }

    pub fn record_cast(&mut self) {
        self.cast_count += 1;
    }
}

impl SimState {
    pub fn new(config: &SimConfig) -> Self {
        let player = UnitState::new(
            config.player.stats,
            config.player.resources,
            config.spells.len(),
        );

        // Initialize spell charges
        let mut state = Self {
            time: 0.0,
            player,
            pet: None, // TODO: initialize pet
            target: TargetState::new(config.target.max_health),
            events: EventQueue::with_capacity(256),
            duration: config.duration,
            results: SimResultsAccum::default(),
        };

        // Set initial charges from spell defs
        for (i, spell) in config.spells.iter().enumerate() {
            state.player.spell_states[i].max_charges = spell.charges;
            state.player.spell_states[i].charges = spell.charges;
        }

        state
    }

    pub fn reset(&mut self) {
        self.time = 0.0;
        self.player.reset();
        if let Some(pet) = &mut self.pet {
            pet.reset();
        }
        self.target.reset();
        self.events.clear();
        self.results.reset();
    }
}
