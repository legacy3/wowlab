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

    collector.record_damage(
        SimTime::from_secs(1),
        SpellIdx(1),
        TargetIdx(0),
        1000.0,
        false,
        false,
    );
    collector.record_damage(
        SimTime::from_secs(2),
        SpellIdx(1),
        TargetIdx(0),
        1500.0,
        true,
        false,
    );
    collector.record_damage(
        SimTime::from_secs(3),
        SpellIdx(2),
        TargetIdx(0),
        800.0,
        false,
        false,
    );

    assert!((collector.total_damage - 3300.0).abs() < 0.1);
    assert!(collector.spell(SpellIdx(1)).is_some());
    assert!(collector.spell(SpellIdx(2)).is_some());
}

#[test]
fn collector_dps() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);

    collector.record_damage(
        SimTime::from_secs(5),
        SpellIdx(1),
        TargetIdx(0),
        5000.0,
        false,
        false,
    );
    collector.set_end(SimTime::from_secs(10));

    assert!((collector.dps() - 500.0).abs() < 0.1);
}

#[test]
fn collector_trace() {
    let mut collector = StatsCollector::new().with_trace();

    collector.record_damage(
        SimTime::from_secs(1),
        SpellIdx(1),
        TargetIdx(0),
        1000.0,
        false,
        false,
    );
    collector.record_damage(
        SimTime::from_secs(2),
        SpellIdx(2),
        TargetIdx(0),
        2000.0,
        true,
        false,
    );

    assert_eq!(collector.events().len(), 2);
    assert!(collector.events()[1].is_crit);
}

#[test]
fn breakdown_from_collector() {
    let mut collector = StatsCollector::new();
    collector.set_start(SimTime::ZERO);

    collector.record_damage(
        SimTime::from_secs(1),
        SpellIdx(1),
        TargetIdx(0),
        6000.0,
        false,
        false,
    );
    collector.record_damage(
        SimTime::from_secs(2),
        SpellIdx(2),
        TargetIdx(0),
        4000.0,
        false,
        false,
    );
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
    collector.record_damage(
        SimTime::from_secs(5),
        SpellIdx(1),
        TargetIdx(0),
        10000.0,
        false,
        false,
    );
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
    collector.record_damage(
        SimTime::from_secs(60),
        SpellIdx(1),
        TargetIdx(0),
        60000.0,
        false,
        false,
    );
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
