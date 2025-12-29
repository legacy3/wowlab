//! Simulation state with cache-friendly layouts.
//!
//! Key optimizations:
//! - Hot fields grouped together for cache locality
//! - Tight struct packing with explicit repr(C)
//! - Minimal padding between fields
//! - Pre-allocated vectors for zero-alloc hot loop

use crate::config::{ResourceConfig, ResourceType, SimConfig, Stats};

use super::EventQueue;

/// Pre-computed aura data (timing + periodic damage)
#[derive(Debug, Clone, Copy, Default)]
pub struct AuraRuntime {
    pub duration_ms: u32,
    pub tick_interval_ms: u32,
    /// Pre-computed periodic damage base (0 if no periodic damage)
    pub tick_amount: f32,
    /// Pre-computed periodic damage coefficient
    pub tick_coefficient: f32,
}

/// Maximum effects per spell (auras to apply)
const MAX_SPELL_AURAS: usize = 4;

/// Pre-computed spell data for hot path - avoids touching SpellDef (has String, Vec)
#[derive(Debug, Clone, Copy, Default)]
#[repr(C)]
pub struct SpellRuntime {
    // Damage calculation (32 bytes)
    pub damage_min: f32,
    pub damage_max: f32,
    pub ap_coefficient: f32,
    pub cost_amount: f32,

    // Pre-resolved aura indices (no more linear search)
    pub apply_aura_indices: [u8; MAX_SPELL_AURAS],
    pub apply_aura_count: u8,

    // Energize effect (if any)
    pub energize_amount: f32,

    // Charges (0 = not charge-based)
    pub max_charges: u8,

    // Padding for alignment
    _pad: [u8; 2],
}

/// Main simulation state - hot fields first for cache locality.
pub struct SimState {
    /// Current simulation time in milliseconds (hot - accessed every event)
    pub time: u32,

    /// Simulation duration in milliseconds (hot - checked every event)
    pub duration: u32,

    /// Player state (hot - accessed most events)
    pub player: UnitState,

    /// Event queue (hot - accessed every event)
    pub events: EventQueue,

    /// Results accumulator (hot - written every cast)
    pub results: SimResultsAccum,

    /// Pre-computed spell runtime data (hot - accessed every cast)
    pub spell_runtime: Vec<SpellRuntime>,

    /// Pre-computed aura runtime data (timing + periodic damage)
    pub aura_runtime: Vec<AuraRuntime>,

    /// Pre-computed weapon speed in ms (base, before haste)
    pub weapon_speed_ms: u32,

    /// Pre-computed pet attack speed in ms
    pub pet_attack_speed_ms: u32,

    /// Next auto attack time (lazy evaluation)
    pub next_auto_attack: u32,

    /// Next pet attack time (lazy evaluation)
    pub next_pet_attack: u32,

    /// Target state (warm - accessed on damage)
    pub target: TargetState,

    /// Pet state (cold - rarely accessed)
    pub pet: Option<UnitState>,
}

/// Runtime state for a unit - cache-friendly layout.
/// Hot fields (accessed every GCD) are grouped at the start.
#[repr(C)]
pub struct UnitState {
    // === Hot fields (every GCD check) ===
    /// Current resources
    pub resources: Resources,

    /// GCD end time in milliseconds
    pub gcd_ready: u32,

    /// Whether a GcdReady event is already scheduled
    pub gcd_event_pending: bool,

    /// Last time resources were updated in milliseconds (for lazy regen)
    pub last_resource_update: u32,

    // === Warm fields (spell casting) ===
    /// Current stats (base + modifiers)
    pub stats: Stats,

    /// Spell cooldown/charge states (indexed by spell position)
    pub spell_states: Vec<SpellState>,

    // === Cold fields (rarely accessed) ===
    /// Base stats (without modifiers) - only used on reset
    pub base_stats: Stats,

    /// Active auras
    pub auras: AuraTracker,

    /// Current cast end time (0 if not casting)
    pub cast_end: f32,

    /// Spell being cast
    pub casting_spell: Option<u32>,
}

impl UnitState {
    pub fn new(stats: Stats, resources: ResourceConfig, spell_count: usize) -> Self {
        let mut stats = stats;
        stats.finalize();
        Self {
            // Hot fields
            resources: Resources::new(resources),
            gcd_ready: 0,
            gcd_event_pending: false,
            last_resource_update: 0,
            // Warm fields
            stats,
            spell_states: vec![SpellState::default(); spell_count],
            // Cold fields
            base_stats: stats,
            auras: AuraTracker::new(),
            cast_end: 0.0,
            casting_spell: None,
        }
    }

    #[inline]
    pub fn reset(&mut self) {
        self.stats = self.base_stats;
        self.resources.reset();
        for state in &mut self.spell_states {
            state.reset();
        }
        self.auras.clear();
        self.gcd_ready = 0;
        self.gcd_event_pending = false;
        self.cast_end = 0.0;
        self.casting_spell = None;
        self.last_resource_update = 0;
    }
}

/// Runtime spell state - pre-computed values for hot path.
#[derive(Debug, Clone, Copy, Default)]
#[repr(C)]
pub struct SpellState {
    /// Time when cooldown is ready in milliseconds
    pub cooldown_ready: u32,

    /// Pre-computed cooldown in ms (from config)
    pub cooldown_ms: u32,

    /// Pre-computed GCD in ms (from config, before haste)
    pub gcd_ms: u32,

    /// Current charges (for charge-based spells)
    pub charges: u8,

    /// Max charges (copied from SpellDef)
    pub max_charges: u8,

    /// Padding for alignment
    _pad: [u8; 2],
}

impl SpellState {
    #[inline]
    pub fn reset(&mut self) {
        self.cooldown_ready = 0;
        self.charges = self.max_charges;
    }
}

/// Resource tracking - compact 16-byte struct.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct Resources {
    pub current: f32,
    pub max: f32,
    pub regen_per_second: f32,
    pub resource_type: ResourceType,
}

impl Resources {
    #[inline]
    pub fn new(config: ResourceConfig) -> Self {
        Self {
            current: config.initial,
            max: config.max,
            regen_per_second: config.regen_per_second,
            resource_type: config.resource_type,
        }
    }

    #[inline]
    pub fn reset(&mut self) {
        self.current = self.max;
    }

    #[inline(always)]
    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            true
        } else {
            false
        }
    }

    #[inline(always)]
    pub fn gain(&mut self, amount: f32) {
        self.current = (self.current + amount).min(self.max);
    }

    #[inline(always)]
    pub fn regen(&mut self, elapsed: f32) {
        self.gain(self.regen_per_second * elapsed);
    }
}

/// Maximum aura slots (matches typical WoW limits)
const MAX_AURA_SLOTS: usize = 32;

/// Slot-based aura tracking - O(1) lookup by aura index.
/// Slots are indexed by aura_idx from config, not aura_id.
pub struct AuraTracker {
    /// Fixed slots indexed by aura_idx - None = inactive
    slots: [Option<AuraInstance>; MAX_AURA_SLOTS],
    /// Next tick time per slot (0 = no pending tick)
    next_tick: [u32; MAX_AURA_SLOTS],
    /// Bitmap of active DoT auras (for fast iteration)
    active_dots: u32,
}

impl AuraTracker {
    pub fn new() -> Self {
        Self {
            slots: [None; MAX_AURA_SLOTS],
            next_tick: [0; MAX_AURA_SLOTS],
            active_dots: 0,
        }
    }

    #[inline]
    pub fn clear(&mut self) {
        self.slots = [None; MAX_AURA_SLOTS];
        self.next_tick = [0; MAX_AURA_SLOTS];
        self.active_dots = 0;
    }

    /// Start DoT tracking for an aura
    #[inline(always)]
    pub fn start_dot(&mut self, slot: usize, first_tick_time: u32) {
        if slot < MAX_AURA_SLOTS {
            self.next_tick[slot] = first_tick_time;
            self.active_dots |= 1 << slot;
        }
    }

    /// Stop DoT tracking for an aura
    #[inline(always)]
    pub fn stop_dot(&mut self, slot: usize) {
        if slot < MAX_AURA_SLOTS {
            self.next_tick[slot] = 0;
            self.active_dots &= !(1 << slot);
        }
    }

    /// Get bitmap of active DoTs
    #[inline(always)]
    pub fn active_dot_mask(&self) -> u32 {
        self.active_dots
    }

    /// Get next tick time for a slot
    #[inline(always)]
    pub fn next_tick_time(&self, slot: usize) -> u32 {
        self.next_tick[slot]
    }

    /// Set next tick time for a slot
    #[inline(always)]
    pub fn set_next_tick(&mut self, slot: usize, time: u32) {
        self.next_tick[slot] = time;
    }

    /// Apply aura by slot index (aura_idx from config) - O(1)
    #[inline(always)]
    pub fn apply_slot(&mut self, slot: usize, duration_ms: u32, max_stacks: u8, current_time: u32) {
        if slot >= MAX_AURA_SLOTS {
            return;
        }
        if let Some(ref mut instance) = self.slots[slot] {
            // Refresh existing aura
            instance.expires = current_time + duration_ms;
            instance.stacks = (instance.stacks + 1).min(max_stacks);
        } else {
            // Apply new aura
            self.slots[slot] = Some(AuraInstance::new(current_time + duration_ms, 1));
        }
    }

    /// Remove aura by slot index - O(1)
    #[inline(always)]
    pub fn remove_slot(&mut self, slot: usize) {
        if slot < MAX_AURA_SLOTS {
            self.slots[slot] = None;
        }
    }

    /// Check if aura is active by slot index - O(1)
    #[inline(always)]
    pub fn has_slot(&self, slot: usize) -> bool {
        slot < MAX_AURA_SLOTS && self.slots[slot].is_some()
    }

    /// Get aura stacks by slot index - O(1)
    #[inline(always)]
    pub fn stacks_slot(&self, slot: usize) -> u8 {
        if slot < MAX_AURA_SLOTS {
            if let Some(instance) = self.slots[slot] {
                instance.stacks
            } else {
                0
            }
        } else {
            0
        }
    }

    /// Get remaining duration in ms by slot index - O(1)
    #[inline(always)]
    pub fn remaining_slot(&self, slot: usize, current_time: u32) -> u32 {
        if slot < MAX_AURA_SLOTS {
            if let Some(instance) = self.slots[slot] {
                instance.expires.saturating_sub(current_time)
            } else {
                0
            }
        } else {
            0
        }
    }

    /// Get aura instance by slot index - O(1)
    #[inline(always)]
    pub fn get_slot(&self, slot: usize) -> Option<AuraInstance> {
        if slot < MAX_AURA_SLOTS {
            self.slots[slot]
        } else {
            None
        }
    }
}

/// Aura instance - compact 8-byte struct.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct AuraInstance {
    pub expires: u32,
    pub stacks: u8,
    _pad: [u8; 3],
}

impl AuraInstance {
    #[inline]
    pub fn new(expires: u32, stacks: u8) -> Self {
        Self {
            expires,
            stacks,
            _pad: [0; 3],
        }
    }
}

impl Default for AuraInstance {
    fn default() -> Self {
        Self::new(0, 0)
    }
}

/// Target state - compact layout.
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

    #[inline]
    pub fn health_pct(&self) -> f32 {
        (self.health / self.max_health) * 100.0
    }

    #[inline]
    pub fn reset(&mut self) {
        self.health = self.max_health;
        self.auras.clear();
    }
}

/// Results accumulator - index by spell position for O(1) access.
#[derive(Debug, Clone)]
pub struct SimResultsAccum {
    pub total_damage: f32,
    pub cast_count: u32,
    /// Damage per spell index (not spell_id)
    pub spell_damage: Vec<f32>,
    /// Cast count per spell index
    pub spell_casts: Vec<u32>,
}

impl SimResultsAccum {
    pub fn new(spell_count: usize) -> Self {
        Self {
            total_damage: 0.0,
            cast_count: 0,
            spell_damage: vec![0.0; spell_count],
            spell_casts: vec![0; spell_count],
        }
    }

    #[inline(always)]
    pub fn reset(&mut self) {
        self.total_damage = 0.0;
        self.cast_count = 0;
        self.spell_damage.fill(0.0);
        self.spell_casts.fill(0);
    }

    #[inline(always)]
    pub fn record_damage(&mut self, spell_idx: usize, damage: f32) {
        self.total_damage += damage;
        // SAFETY: spell_idx is always < spell_count (validated at config time)
        unsafe {
            *self.spell_damage.get_unchecked_mut(spell_idx) += damage;
            *self.spell_casts.get_unchecked_mut(spell_idx) += 1;
        }
    }

    #[inline(always)]
    pub fn record_cast(&mut self) {
        self.cast_count += 1;
    }
}

impl Default for SimResultsAccum {
    fn default() -> Self {
        Self::new(0)
    }
}

impl SimState {
    pub fn new(config: &SimConfig) -> Self {
        let spell_count = config.spells.len();
        let player = UnitState::new(config.player.stats, config.player.resources, spell_count);

        // Convert duration from f32 seconds to u32 milliseconds
        let duration_ms = (config.duration * 1000.0) as u32;

        // Pre-compute aura runtime values (timing + periodic damage)
        let aura_runtime: Vec<AuraRuntime> = config
            .auras
            .iter()
            .map(|a| {
                let mut runtime = AuraRuntime {
                    duration_ms: (a.duration * 1000.0) as u32,
                    tick_interval_ms: (a.tick_interval * 1000.0) as u32,
                    tick_amount: 0.0,
                    tick_coefficient: 0.0,
                };
                // Extract periodic damage from effects
                for effect in &a.effects {
                    if let crate::config::AuraEffect::PeriodicDamage {
                        amount,
                        coefficient,
                    } = effect
                    {
                        runtime.tick_amount = *amount;
                        runtime.tick_coefficient = *coefficient;
                        break;
                    }
                }
                runtime
            })
            .collect();

        // Pre-compute attack speeds
        let weapon_speed_ms = (config.player.weapon_speed * 1000.0) as u32;
        let pet_attack_speed_ms = config
            .pet
            .as_ref()
            .map(|p| (p.attack_speed * 1000.0) as u32)
            .unwrap_or(0);

        // Pre-compute spell runtime data (avoids touching SpellDef in hot loop)
        let spell_runtime: Vec<SpellRuntime> = config
            .spells
            .iter()
            .map(|spell| {
                let mut runtime = SpellRuntime {
                    damage_min: spell.damage.base_min,
                    damage_max: spell.damage.base_max,
                    ap_coefficient: spell.damage.ap_coefficient,
                    cost_amount: spell.cost.amount,
                    max_charges: spell.charges,
                    apply_aura_indices: [0; MAX_SPELL_AURAS],
                    apply_aura_count: 0,
                    energize_amount: 0.0,
                    _pad: [0; 2],
                };

                // Pre-resolve effects
                for effect in &spell.effects {
                    match effect {
                        crate::config::SpellEffect::ApplyAura { aura_id, .. } => {
                            // Resolve aura_id to aura_idx at load time (no more linear search per cast)
                            if let Some(aura_idx) =
                                config.auras.iter().position(|a| a.id == *aura_id)
                            {
                                if (runtime.apply_aura_count as usize) < MAX_SPELL_AURAS {
                                    runtime.apply_aura_indices[runtime.apply_aura_count as usize] =
                                        aura_idx as u8;
                                    runtime.apply_aura_count += 1;
                                }
                            }
                        }
                        crate::config::SpellEffect::Energize { amount, .. } => {
                            runtime.energize_amount = *amount;
                        }
                        _ => {}
                    }
                }
                runtime
            })
            .collect();

        let mut state = Self {
            time: 0,
            duration: duration_ms,
            player,
            #[cfg(feature = "large_capacity")]
            events: EventQueue::with_capacity(16384),
            #[cfg(not(feature = "large_capacity"))]
            events: EventQueue::with_capacity(256),
            results: SimResultsAccum::new(spell_count),
            spell_runtime,
            aura_runtime,
            weapon_speed_ms,
            pet_attack_speed_ms,
            next_auto_attack: 0,
            next_pet_attack: 0,
            target: TargetState::new(config.target.max_health),
            pet: None,
        };

        // Set initial charges and pre-compute ms values from spell defs
        for (i, spell) in config.spells.iter().enumerate() {
            state.player.spell_states[i].max_charges = spell.charges;
            state.player.spell_states[i].charges = spell.charges;
            state.player.spell_states[i].cooldown_ms = (spell.cooldown * 1000.0) as u32;
            state.player.spell_states[i].gcd_ms = (spell.gcd * 1000.0) as u32;
        }

        state
    }

    #[inline]
    pub fn reset(&mut self) {
        self.time = 0;
        self.next_auto_attack = 0;
        self.next_pet_attack = 0;
        self.player.reset();
        if let Some(pet) = &mut self.pet {
            pet.reset();
        }
        self.target.reset();
        self.events.clear();
        self.results.reset();
    }
}
