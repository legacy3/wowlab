# Phase 12: Results

## Goal

Create the results system: statistics, damage breakdown, trace output.

## Prerequisites

Phase 11 complete. `cargo test -p engine_new` passes (132 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod results;
└── results/
    ├── mod.rs
    ├── collector.rs
    ├── breakdown.rs
    └── export.rs
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
pub mod spec;
pub mod sim;
pub mod rotation;
pub mod results;
```

### `src/results/mod.rs`

```rust
mod collector;
mod breakdown;
mod export;

pub use collector::*;
pub use breakdown::*;
pub use export::*;

#[cfg(test)]
mod tests;
```

### `src/results/collector.rs`

```rust
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
        let duration = (self.end_time - self.start_time).as_secs_f64();
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
```

### `src/results/breakdown.rs`

```rust
use super::{StatsCollector, SpellStats};
use crate::types::SpellIdx;
use std::collections::HashMap;

/// Damage breakdown entry
#[derive(Clone, Debug)]
pub struct BreakdownEntry {
    pub spell: SpellIdx,
    pub name: String,
    pub damage: f64,
    pub dps: f64,
    pub percent: f32,
    pub count: u32,
    pub average: f32,
    pub crit_rate: f32,
}

/// Complete damage breakdown
#[derive(Clone, Debug)]
pub struct DamageBreakdown {
    pub entries: Vec<BreakdownEntry>,
    pub total_damage: f64,
    pub total_dps: f64,
    pub duration_secs: f32,
}

impl DamageBreakdown {
    /// Build breakdown from collector
    pub fn from_collector(
        collector: &StatsCollector,
        spell_names: &HashMap<SpellIdx, String>,
    ) -> Self {
        let duration = collector.duration().as_secs_f32();
        let total = collector.total_damage;

        let mut entries: Vec<_> = collector.spells()
            .map(|stats| {
                let name = spell_names.get(&stats.spell)
                    .cloned()
                    .unwrap_or_else(|| format!("Spell_{}", stats.spell.0));

                let damage = stats.total();
                let dps = if duration > 0.0 { damage / duration as f64 } else { 0.0 };
                let percent = if total > 0.0 { (damage / total * 100.0) as f32 } else { 0.0 };

                BreakdownEntry {
                    spell: stats.spell,
                    name,
                    damage,
                    dps,
                    percent,
                    count: stats.count + stats.tick_count,
                    average: ((stats.total_damage + stats.tick_damage) / (stats.count + stats.tick_count).max(1) as f64) as f32,
                    crit_rate: stats.crit_rate(),
                }
            })
            .collect();

        // Sort by damage descending
        entries.sort_by(|a, b| b.damage.partial_cmp(&a.damage).unwrap());

        Self {
            entries,
            total_damage: total,
            total_dps: if duration > 0.0 { total / duration as f64 } else { 0.0 },
            duration_secs: duration,
        }
    }

    /// Format as table
    pub fn to_table(&self) -> String {
        let mut output = String::new();

        output.push_str(&format!(
            "\n{:30} {:>12} {:>10} {:>8} {:>8} {:>8}\n",
            "Ability", "Damage", "DPS", "%", "Count", "Avg"
        ));
        output.push_str(&"-".repeat(80));
        output.push('\n');

        for entry in &self.entries {
            output.push_str(&format!(
                "{:30} {:>12.0} {:>10.1} {:>7.1}% {:>8} {:>8.0}\n",
                entry.name,
                entry.damage,
                entry.dps,
                entry.percent,
                entry.count,
                entry.average,
            ));
        }

        output.push_str(&"-".repeat(80));
        output.push_str(&format!(
            "\n{:30} {:>12.0} {:>10.1}\n",
            "Total",
            self.total_damage,
            self.total_dps,
        ));

        output
    }
}

/// Proc statistics
#[derive(Clone, Debug, Default)]
pub struct ProcBreakdown {
    pub entries: Vec<ProcEntry>,
}

#[derive(Clone, Debug)]
pub struct ProcEntry {
    pub name: String,
    pub procs: u32,
    pub ppm: f32,
    pub uptime: f32,
}

/// Cooldown usage statistics
#[derive(Clone, Debug, Default)]
pub struct CooldownBreakdown {
    pub entries: Vec<CooldownEntry>,
}

#[derive(Clone, Debug)]
pub struct CooldownEntry {
    pub spell: SpellIdx,
    pub name: String,
    pub uses: u32,
    pub possible_uses: u32,
    pub efficiency: f32,
}
```

### `src/results/export.rs`

```rust
use super::{DamageBreakdown, StatsCollector};
use crate::sim::BatchResults;
use std::io::Write;

/// Export format
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ExportFormat {
    Json,
    Csv,
    Text,
}

/// Export simulation results
pub struct ResultsExporter;

impl ResultsExporter {
    /// Export batch results to JSON
    pub fn to_json(results: &BatchResults) -> String {
        format!(
            r#"{{
  "iterations": {},
  "mean_dps": {:.2},
  "std_dev": {:.2},
  "min_dps": {:.2},
  "max_dps": {:.2},
  "median_dps": {:.2},
  "cv": {:.4}
}}"#,
            results.iterations,
            results.mean_dps,
            results.std_dev,
            results.min_dps,
            results.max_dps,
            results.median(),
            results.cv(),
        )
    }

    /// Export batch results to CSV
    pub fn to_csv(results: &BatchResults) -> String {
        let mut output = String::from("iteration,dps\n");
        for (i, dps) in results.dps_values.iter().enumerate() {
            output.push_str(&format!("{},{:.2}\n", i + 1, dps));
        }
        output
    }

    /// Export breakdown to JSON
    pub fn breakdown_to_json(breakdown: &DamageBreakdown) -> String {
        let entries: Vec<String> = breakdown.entries.iter()
            .map(|e| format!(
                r#"    {{
      "name": "{}",
      "damage": {:.0},
      "dps": {:.2},
      "percent": {:.2},
      "count": {},
      "average": {:.0},
      "crit_rate": {:.2}
    }}"#,
                e.name, e.damage, e.dps, e.percent, e.count, e.average, e.crit_rate
            ))
            .collect();

        format!(
            r#"{{
  "total_damage": {:.0},
  "total_dps": {:.2},
  "duration": {:.2},
  "abilities": [
{}
  ]
}}"#,
            breakdown.total_damage,
            breakdown.total_dps,
            breakdown.duration_secs,
            entries.join(",\n")
        )
    }

    /// Write results to file
    pub fn write_to_file(
        path: &std::path::Path,
        content: &str,
    ) -> std::io::Result<()> {
        let mut file = std::fs::File::create(path)?;
        file.write_all(content.as_bytes())?;
        Ok(())
    }
}

/// Summary statistics for display
#[derive(Clone, Debug)]
pub struct SimSummary {
    pub dps: f64,
    pub damage: f64,
    pub duration_secs: f32,
    pub iterations: u32,
    pub std_dev: Option<f64>,
}

impl SimSummary {
    pub fn from_single(collector: &StatsCollector) -> Self {
        Self {
            dps: collector.dps(),
            damage: collector.total_damage,
            duration_secs: collector.duration().as_secs_f32(),
            iterations: 1,
            std_dev: None,
        }
    }

    pub fn from_batch(results: &BatchResults, duration_secs: f32) -> Self {
        Self {
            dps: results.mean_dps,
            damage: results.mean_dps * duration_secs as f64,
            duration_secs,
            iterations: results.iterations,
            std_dev: Some(results.std_dev),
        }
    }

    pub fn format(&self) -> String {
        let mut output = format!(
            "DPS: {:.2}\nDamage: {:.0}\nDuration: {:.1}s\n",
            self.dps, self.damage, self.duration_secs
        );

        if self.iterations > 1 {
            output.push_str(&format!("Iterations: {}\n", self.iterations));
        }

        if let Some(std_dev) = self.std_dev {
            output.push_str(&format!("Std Dev: {:.2}\n", std_dev));
        }

        output
    }
}
```

### `src/results/tests.rs`

```rust
use super::*;
use crate::types::*;
use std::collections::HashMap;

#[test]
fn spell_stats_record() {
    let mut stats = SpellStats::new(SpellIdx(1));

    stats.record(1000.0, false, false);
    stats.record(1500.0, true, false);
    stats.record(800.0, false, false);

    assert_eq!(stats.count, 3);
    assert_eq!(stats.crits, 1);
    assert!((stats.total_damage - 3300.0).abs() < 0.1);
    assert!((stats.max_hit - 1500.0).abs() < 0.1);
    assert!((stats.min_hit - 800.0).abs() < 0.1);
}

#[test]
fn spell_stats_periodic() {
    let mut stats = SpellStats::new(SpellIdx(1));

    stats.record(500.0, false, true);
    stats.record(500.0, false, true);
    stats.record(500.0, false, true);

    assert_eq!(stats.tick_count, 3);
    assert!((stats.tick_damage - 1500.0).abs() < 0.1);
    assert_eq!(stats.count, 0); // Direct hits
}

#[test]
fn spell_stats_crit_rate() {
    let mut stats = SpellStats::new(SpellIdx(1));

    stats.record(1000.0, true, false);
    stats.record(1000.0, true, false);
    stats.record(1000.0, false, false);
    stats.record(1000.0, false, false);

    assert!((stats.crit_rate() - 0.5).abs() < 0.01);
}

#[test]
fn collector_record() {
    let mut collector = StatsCollector::new();

    collector.record_damage(SimTime::from_secs(1), SpellIdx(1), TargetIdx(0), 1000.0, false, false);
    collector.record_damage(SimTime::from_secs(2), SpellIdx(1), TargetIdx(0), 1500.0, true, false);
    collector.record_damage(SimTime::from_secs(3), SpellIdx(2), TargetIdx(0), 800.0, false, false);

    assert!((collector.total_damage - 3300.0).abs() < 0.1);
    assert!(collector.spell(SpellIdx(1)).is_some());
    assert!(collector.spell(SpellIdx(2)).is_some());
}

#[test]
fn collector_dps() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);

    collector.record_damage(SimTime::from_secs(5), SpellIdx(1), TargetIdx(0), 5000.0, false, false);
    collector.set_end(SimTime::from_secs(10));

    assert!((collector.dps() - 500.0).abs() < 0.1);
}

#[test]
fn collector_trace() {
    let mut collector = StatsCollector::new().with_trace();

    collector.record_damage(SimTime::from_secs(1), SpellIdx(1), TargetIdx(0), 1000.0, false, false);
    collector.record_damage(SimTime::from_secs(2), SpellIdx(2), TargetIdx(0), 2000.0, true, false);

    assert_eq!(collector.events().len(), 2);
    assert!(collector.events()[1].is_crit);
}

#[test]
fn breakdown_from_collector() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);

    collector.record_damage(SimTime::from_secs(1), SpellIdx(1), TargetIdx(0), 6000.0, false, false);
    collector.record_damage(SimTime::from_secs(2), SpellIdx(2), TargetIdx(0), 4000.0, false, false);
    collector.set_end(SimTime::from_secs(10));

    let mut names = HashMap::new();
    names.insert(SpellIdx(1), "Fireball".to_string());
    names.insert(SpellIdx(2), "Frostbolt".to_string());

    let breakdown = DamageBreakdown::from_collector(&collector, &names);

    assert_eq!(breakdown.entries.len(), 2);
    assert_eq!(breakdown.entries[0].name, "Fireball"); // Higher damage first
    assert!((breakdown.entries[0].percent - 60.0).abs() < 0.1);
}

#[test]
fn breakdown_table() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);
    collector.record_damage(SimTime::from_secs(5), SpellIdx(1), TargetIdx(0), 10000.0, false, false);
    collector.set_end(SimTime::from_secs(10));

    let mut names = HashMap::new();
    names.insert(SpellIdx(1), "Test Spell".to_string());

    let breakdown = DamageBreakdown::from_collector(&collector, &names);
    let table = breakdown.to_table();

    assert!(table.contains("Test Spell"));
    assert!(table.contains("10000"));
}

#[test]
fn resource_stats() {
    let mut stats = ResourceStats::default();

    stats.record_spend(50.0);
    stats.record_spend(30.0);
    stats.record_gain(100.0, 10.0);

    assert!((stats.total_spent - 80.0).abs() < 0.1);
    assert!((stats.total_gained - 100.0).abs() < 0.1);
    assert!((stats.wasted - 10.0).abs() < 0.1);
    assert!((stats.waste_rate() - 0.1).abs() < 0.01);
}

#[test]
fn export_json() {
    let results = crate::sim::BatchResults::from_values(vec![1000.0, 1100.0, 1050.0]);
    let json = ResultsExporter::to_json(&results);

    assert!(json.contains("\"iterations\": 3"));
    assert!(json.contains("mean_dps"));
}

#[test]
fn export_csv() {
    let results = crate::sim::BatchResults::from_values(vec![1000.0, 1100.0]);
    let csv = ResultsExporter::to_csv(&results);

    assert!(csv.starts_with("iteration,dps\n"));
    assert!(csv.contains("1,1000.00"));
    assert!(csv.contains("2,1100.00"));
}

#[test]
fn sim_summary_single() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);
    collector.record_damage(SimTime::from_secs(60), SpellIdx(1), TargetIdx(0), 60000.0, false, false);
    collector.set_end(SimTime::from_secs(60));

    let summary = SimSummary::from_single(&collector);

    assert!((summary.dps - 1000.0).abs() < 0.1);
    assert!((summary.duration_secs - 60.0).abs() < 0.1);
    assert!(summary.std_dev.is_none());
}

#[test]
fn sim_summary_batch() {
    let results = crate::sim::BatchResults::from_values(vec![1000.0, 1100.0, 1050.0]);
    let summary = SimSummary::from_batch(&results, 300.0);

    assert_eq!(summary.iterations, 3);
    assert!(summary.std_dev.is_some());
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (132 + 14 = 146 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod results;`
- [ ] Create `src/results/mod.rs`
- [ ] Create `src/results/collector.rs`
- [ ] Create `src/results/breakdown.rs`
- [ ] Create `src/results/export.rs`
- [ ] Create `src/results/tests.rs`
- [ ] Run `cargo test` — 146 tests pass
