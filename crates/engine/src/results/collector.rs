use crate::types::{SpellIdx, SimTime, TargetIdx};
use std::collections::HashMap;

/// Single damage event record
#[derive(Clone, Debug)]
pub struct DamageRecord {
    pub time: SimTime,
    pub spell: SpellIdx,
    pub target: TargetIdx,
    pub amount: f32,
    pub is_crit: bool,
    pub is_periodic: bool,
}

/// Accumulated spell statistics
#[derive(Clone, Debug, Default)]
pub struct SpellStats {
    /// Spell ID
    pub spell: SpellIdx,
    /// Number of casts/hits
    pub count: u32,
    /// Number of crits
    pub crits: u32,
    /// Total damage
    pub total_damage: f64,
    /// Max single hit
    pub max_hit: f32,
    /// Min single hit
    pub min_hit: f32,
    /// Total periodic ticks
    pub tick_count: u32,
    /// Total periodic damage
    pub tick_damage: f64,
}

impl SpellStats {
    pub fn new(spell: SpellIdx) -> Self {
        Self {
            spell,
            min_hit: f32::MAX,
            ..Default::default()
        }
    }

    pub fn record(&mut self, damage: f32, is_crit: bool, is_periodic: bool) {
        if is_periodic {
            self.tick_count += 1;
            self.tick_damage += damage as f64;
        } else {
            self.count += 1;
            self.total_damage += damage as f64;
            self.max_hit = self.max_hit.max(damage);
            self.min_hit = self.min_hit.min(damage);

            if is_crit {
                self.crits += 1;
            }
        }
    }

    /// Average damage per hit
    pub fn average(&self) -> f32 {
        if self.count > 0 {
            (self.total_damage / self.count as f64) as f32
        } else {
            0.0
        }
    }

    /// Crit rate
    pub fn crit_rate(&self) -> f32 {
        if self.count > 0 {
            self.crits as f32 / self.count as f32
        } else {
            0.0
        }
    }

    /// Average tick damage
    pub fn average_tick(&self) -> f32 {
        if self.tick_count > 0 {
            (self.tick_damage / self.tick_count as f64) as f32
        } else {
            0.0
        }
    }

    /// Total damage (direct + periodic)
    pub fn total(&self) -> f64 {
        self.total_damage + self.tick_damage
    }
}

/// Collects statistics during simulation
#[derive(Clone, Debug, Default)]
pub struct StatsCollector {
    /// Per-spell statistics
    spells: HashMap<SpellIdx, SpellStats>,
    /// All damage events (if trace enabled)
    events: Vec<DamageRecord>,
    /// Total damage
    pub total_damage: f64,
    /// Fight start time
    start_time: SimTime,
    /// Fight end time
    end_time: SimTime,
    /// Whether to collect individual events
    trace_enabled: bool,
}

impl StatsCollector {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_trace(mut self) -> Self {
        self.trace_enabled = true;
        self
    }

    /// Reset for new iteration
    pub fn reset(&mut self) {
        self.spells.clear();
        self.events.clear();
        self.total_damage = 0.0;
        self.start_time = SimTime::ZERO;
        self.end_time = SimTime::ZERO;
    }

    /// Record damage event
    pub fn record_damage(
        &mut self,
        time: SimTime,
        spell: SpellIdx,
        target: TargetIdx,
        amount: f32,
        is_crit: bool,
        is_periodic: bool,
    ) {
        // Update totals
        self.total_damage += amount as f64;
        self.end_time = time;

        // Update spell stats
        let stats = self.spells.entry(spell).or_insert_with(|| SpellStats::new(spell));
        stats.record(amount, is_crit, is_periodic);

        // Store event if tracing
        if self.trace_enabled {
            self.events.push(DamageRecord {
                time,
                spell,
                target,
                amount,
                is_crit,
                is_periodic,
            });
        }
    }

    /// Get spell stats
    pub fn spell(&self, spell: SpellIdx) -> Option<&SpellStats> {
        self.spells.get(&spell)
    }

    /// Iterate all spell stats
    pub fn spells(&self) -> impl Iterator<Item = &SpellStats> {
        self.spells.values()
    }

    /// Get all events (if trace enabled)
    pub fn events(&self) -> &[DamageRecord] {
        &self.events
    }

    /// Calculate DPS
    pub fn dps(&self) -> f64 {
        let duration = (self.end_time - self.start_time).as_secs_f32() as f64;
        if duration > 0.0 {
            self.total_damage / duration
        } else {
            0.0
        }
    }

    /// Set start time
    pub fn set_start(&mut self, time: SimTime) {
        self.start_time = time;
    }

    /// Set end time
    pub fn set_end(&mut self, time: SimTime) {
        self.end_time = time;
    }

    /// Fight duration
    pub fn duration(&self) -> SimTime {
        self.end_time - self.start_time
    }
}

/// Resource usage statistics
#[derive(Clone, Debug, Default)]
pub struct ResourceStats {
    /// Total resource spent
    pub total_spent: f64,
    /// Total resource gained
    pub total_gained: f64,
    /// Peak resource
    pub peak: f32,
    /// Time at cap
    pub time_at_cap: SimTime,
    /// Total wasted (gained while at cap)
    pub wasted: f64,
}

impl ResourceStats {
    pub fn record_spend(&mut self, amount: f32) {
        self.total_spent += amount as f64;
    }

    pub fn record_gain(&mut self, amount: f32, wasted: f32) {
        self.total_gained += amount as f64;
        self.wasted += wasted as f64;
    }

    pub fn record_state(&mut self, current: f32, max: f32, dt: SimTime) {
        self.peak = self.peak.max(current);
        if (current - max).abs() < 0.01 {
            self.time_at_cap = self.time_at_cap + dt;
        }
    }

    /// Percentage of resource wasted
    pub fn waste_rate(&self) -> f32 {
        if self.total_gained > 0.0 {
            (self.wasted / self.total_gained) as f32
        } else {
            0.0
        }
    }
}
