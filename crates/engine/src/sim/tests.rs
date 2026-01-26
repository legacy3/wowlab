use super::*;
use crate::actor::Player;
use crate::handler::SpecHandler;
use crate::specs::BmHunter;
use wowlab_common::types::*;
use std::sync::Arc;

fn create_handler() -> Arc<dyn SpecHandler> {
    Arc::new(BmHunter::with_defaults().expect("Failed to create BmHunter"))
}

#[test]
fn sim_config_defaults() {
    let config = SimConfig::default();

    assert_eq!(config.duration.as_secs_f32(), 300.0);
    assert_eq!(config.target_count, 1);
}

#[test]
fn sim_config_patchwerk() {
    let config = SimConfig::patchwerk();

    assert_eq!(config.target_count, 1);
    assert_eq!(config.duration.as_secs_f32(), 300.0);
}

#[test]
fn sim_config_aoe() {
    let config = SimConfig::aoe(5);

    assert_eq!(config.target_count, 5);
    assert!(config.targets_stacked);
}

#[test]
fn sim_state_creation() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);

    assert_eq!(state.now(), SimTime::ZERO);
    assert!(!state.finished);
    assert_eq!(state.iteration, 0);
}

#[test]
fn sim_state_progress() {
    let config = SimConfig::default().with_duration(100.0);
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);

    assert!((state.progress() - 0.0).abs() < 0.01);
    assert!((state.remaining().as_secs_f32() - 100.0).abs() < 0.1);
}

#[test]
fn sim_state_reset() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    state.total_damage = 1000000.0;
    state.iteration = 5;

    state.reset(10);

    assert_eq!(state.iteration, 10);
    assert_eq!(state.total_damage, 0.0);
}

#[test]
fn sim_state_record_damage() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    state.record_damage(1000.0);
    state.record_damage(2000.0);

    assert_eq!(state.total_damage, 3000.0);
}

#[test]
fn batch_results_statistics() {
    let values = vec![100.0, 110.0, 120.0, 130.0, 140.0];
    let results = BatchResults::from_values(values);

    assert_eq!(results.iterations, 5);
    assert!((results.mean_dps - 120.0).abs() < 0.01);
    assert!((results.min_dps - 100.0).abs() < 0.01);
    assert!((results.max_dps - 140.0).abs() < 0.01);
}

#[test]
fn batch_results_percentile() {
    let values: Vec<f64> = (1..=100).map(|i| i as f64).collect();
    let results = BatchResults::from_values(values);

    assert!((results.percentile(50.0) - 50.0).abs() < 1.0);
    assert!((results.percentile(0.0) - 1.0).abs() < 0.01);
    assert!((results.percentile(100.0) - 100.0).abs() < 0.01);
}

#[test]
fn batch_results_cv() {
    let values = vec![100.0, 100.0, 100.0]; // No variance
    let results = BatchResults::from_values(values);

    assert!((results.cv() - 0.0).abs() < 0.01);
}

#[test]
fn batch_runner_basic() {
    let handler = create_handler();
    let config = SimConfig::default().with_duration(10.0);
    let player = Player::new(SpecId::BeastMastery);
    let runner = BatchRunner::with_handler(handler, config, player).with_iterations(10);

    let results = runner.run();

    assert_eq!(results.iterations, 10);
}

#[test]
fn progress_tracking() {
    let progress = ExactProgress::new(100);

    assert_eq!(progress.completed(), 0);
    assert_eq!(progress.total(), 100);

    progress.record_iteration(1000.0);
    progress.record_iteration(1100.0);

    assert_eq!(progress.completed(), 2);
    assert!((progress.percent() - 2.0).abs() < 0.01);
    assert!((progress.running_mean() - 1050.0).abs() < 0.01);
}

#[test]
fn decision_context_basic() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);
    let ctx = DecisionContext::new(&state);

    assert!(ctx.can_cast());
    assert!((ctx.target_health_pct() - 1.0).abs() < 0.01);
}

#[test]
fn simulation_runs_to_completion() {
    let handler = create_handler();
    let config = SimConfig::default().with_duration(1.0); // 1 second fight
    let player = Player::new(SpecId::BeastMastery);

    let mut sim = Simulation::new(handler, config, player);
    sim.run();

    assert!(sim.state.finished);
    assert!((sim.state.now().as_secs_f32() - 1.0).abs() < 0.01);
}

#[test]
fn sim_config_builders() {
    let config = SimConfig::default()
        .with_duration(120.0)
        .with_seed(12345)
        .with_trace();

    assert!((config.duration.as_secs_f32() - 120.0).abs() < 0.01);
    assert_eq!(config.seed, 12345);
    assert!(config.trace_events);
}

#[test]
fn simulation_current_dps() {
    let handler = create_handler();
    let config = SimConfig::default().with_duration(10.0);
    let player = Player::new(SpecId::BeastMastery);

    let mut sim = Simulation::new(handler, config, player);
    sim.run();

    // DPS should be 0 since empty rotation does nothing
    assert_eq!(sim.dps(), 0.0);
}
