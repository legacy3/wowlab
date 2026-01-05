use crate::types::SpecId;
use crate::sim::{SimConfig, SimState, SimExecutor, BatchResults};
use crate::actor::Player;
use crate::rotation::RotationCompiler;
use crate::results::ResultsExporter;
use crate::specs::BeastMasteryHandler;
use super::{Args, Command, SpecArg, OutputFormat, GearConfig};
use tracing::{debug, info, warn, instrument};

pub struct Runner;

impl Runner {
    pub fn run(args: Args) -> Result<(), String> {
        match args.command {
            Command::Sim {
                spec,
                duration,
                iterations,
                targets,
                seed,
                output,
                rotation,
                gear,
                trace,
            } => {
                Self::run_sim(
                    spec,
                    duration,
                    iterations,
                    targets,
                    seed,
                    output,
                    rotation,
                    gear,
                    trace,
                )
            }

            Command::Specs => {
                Self::list_specs()
            }

            Command::Validate { file } => {
                Self::validate_rotation(&file)
            }

            Command::Version => {
                println!("engine_new v{}", env!("CARGO_PKG_VERSION"));
                Ok(())
            }
        }
    }

    #[instrument(skip(gear_file, rotation_file), fields(spec = ?spec, iterations, targets, duration))]
    fn run_sim(
        spec: SpecArg,
        duration: f32,
        iterations: u32,
        targets: usize,
        seed: Option<u64>,
        output: OutputFormat,
        rotation_file: Option<String>,
        gear_file: Option<String>,
        trace: bool,
    ) -> Result<(), String> {
        info!(spec = ?spec, iterations, targets, duration_secs = duration, "Starting simulation");

        // Load rotation script
        let rotation_script = Self::load_rotation_script(spec, rotation_file.as_deref())?;

        // Initialize rotation for this spec
        match spec.to_spec_id() {
            SpecId::BeastMastery => {
                BeastMasteryHandler::init_rotation(&rotation_script)?;
            }
            _ => {}
        }

        // Load gear
        let gear = if let Some(ref path) = gear_file {
            debug!(path, "Loading gear configuration");
            GearConfig::from_file(path)?
        } else {
            debug!("Using default gear configuration");
            GearConfig::default()
        };

        // Setup player
        let spec_id = spec.to_spec_id();
        let mut player = Player::new(spec_id);

        // Apply gear stats
        gear.apply_to(&mut player.stats, spec_id);
        // Compute derived combat stats
        player.stats.update(1.0);
        debug!(
            attack_power = player.stats.attack_power(),
            crit = %format!("{:.2}%", player.stats.crit_chance() * 100.0),
            haste = %format!("{:.2}%", (player.stats.haste() - 1.0) * 100.0),
            "Player stats configured"
        );

        // Initialize spec
        match spec_id {
            SpecId::BeastMastery => {
                BeastMasteryHandler::init_player(&mut player);
            }
            _ => {
                warn!(spec = ?spec_id, "Spec not implemented");
                return Err("Spec not implemented".to_string());
            }
        }

        // Setup config
        let mut config = SimConfig::default()
            .with_duration(duration);

        if let Some(s) = seed {
            config = config.with_seed(s);
            debug!(seed = s, "Using fixed seed");
        }

        if trace {
            config = config.with_trace();
            debug!("Event tracing enabled");
        }

        config.target_count = targets;

        // Run simulation
        if iterations == 1 {
            debug!("Running single iteration");
            let mut state = SimState::new(config, player);

            match spec_id {
                SpecId::BeastMastery => {
                    BeastMasteryHandler::init_sim(&mut state);
                }
                _ => {}
            }

            SimExecutor::run(&mut state);

            info!(dps = state.current_dps(), damage = state.total_damage, "Simulation complete");
            Self::output_single(&state, output)?;
        } else {
            debug!(iterations, "Running batch simulation");
            let results = Self::run_batch(spec_id, config, player, iterations);
            info!(
                mean_dps = results.mean_dps,
                std_dev = results.std_dev,
                iterations = results.iterations,
                "Batch simulation complete"
            );
            Self::output_batch(&results, output, duration)?;
        }

        Ok(())
    }

    /// Run batch simulation with proper spec initialization per iteration
    fn run_batch(
        spec_id: SpecId,
        config: SimConfig,
        player_template: Player,
        iterations: u32,
    ) -> BatchResults {
        let mut dps_values = Vec::with_capacity(iterations as usize);

        for i in 0..iterations {
            let mut iter_config = config.clone();
            iter_config.seed = config.seed.wrapping_add(i as u64);

            let mut state = SimState::new(iter_config, player_template.clone());

            // Call spec-specific init
            match spec_id {
                SpecId::BeastMastery => {
                    BeastMasteryHandler::init_sim(&mut state);
                }
                _ => {}
            }

            SimExecutor::run(&mut state);
            let dps = state.current_dps();
            dps_values.push(dps);

            // Progress (CLI output, not tracing)
            let done = i + 1;
            if done % 100 == 0 || done == iterations {
                eprint!("\rProgress: {}/{} ({:.1}%)", done, iterations, (done as f32 / iterations as f32) * 100.0);
            }

            // Debug log every 10% of iterations
            if done % (iterations / 10).max(1) == 0 {
                debug!(iteration = done, current_dps = dps, "Batch progress");
            }
        }
        eprintln!(); // New line after progress

        BatchResults::from_values(dps_values)
    }

    fn output_single(state: &SimState, format: OutputFormat) -> Result<(), String> {
        match format {
            OutputFormat::Text => {
                println!("\n=== Simulation Results ===");
                println!("Duration: {:.1}s", state.config.duration.as_secs_f32());
                println!("DPS: {:.2}", state.current_dps());
                println!("Total Damage: {:.0}", state.total_damage);
            }

            OutputFormat::Json => {
                let json = format!(
                    r#"{{"dps": {:.2}, "damage": {:.0}, "duration": {:.2}}}"#,
                    state.current_dps(),
                    state.total_damage,
                    state.config.duration.as_secs_f32(),
                );
                println!("{}", json);
            }

            OutputFormat::Csv => {
                println!("dps,damage,duration");
                println!("{:.2},{:.0},{:.2}",
                    state.current_dps(),
                    state.total_damage,
                    state.config.duration.as_secs_f32(),
                );
            }
        }

        Ok(())
    }

    fn output_batch(results: &BatchResults, format: OutputFormat, _duration: f32) -> Result<(), String> {
        match format {
            OutputFormat::Text => {
                println!("\n=== Batch Results ===");
                println!("Iterations: {}", results.iterations);
                println!("Mean DPS: {:.2}", results.mean_dps);
                println!("Std Dev: {:.2}", results.std_dev);
                println!("Min DPS: {:.2}", results.min_dps);
                println!("Max DPS: {:.2}", results.max_dps);
                println!("Median: {:.2}", results.median());
                println!("CV: {:.2}%", results.cv() * 100.0);
            }

            OutputFormat::Json => {
                println!("{}", ResultsExporter::to_json(results));
            }

            OutputFormat::Csv => {
                println!("{}", ResultsExporter::to_csv(results));
            }
        }

        Ok(())
    }

    fn list_specs() -> Result<(), String> {
        println!("Available specs:");
        println!("  bm-hunter  - Beast Mastery Hunter");
        // Add more as implemented
        Ok(())
    }

    /// Load rotation script from file or use default
    fn load_rotation_script(spec: SpecArg, path: Option<&str>) -> Result<String, String> {
        if let Some(p) = path {
            debug!(path = p, "Loading rotation script");
            std::fs::read_to_string(p)
                .map_err(|e| format!("Failed to read rotation file: {}", e))
        } else {
            // Use default rotation for spec
            let default_path = match spec {
                SpecArg::BmHunter => "rotations/bm_hunter.rhai",
            };
            debug!(path = default_path, "Loading default rotation script");
            std::fs::read_to_string(default_path)
                .map_err(|e| format!("Failed to read default rotation '{}': {}", default_path, e))
        }
    }

    fn validate_rotation(file: &str) -> Result<(), String> {
        debug!(file, "Validating rotation script");
        let content = std::fs::read_to_string(file)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        match RotationCompiler::compile(&content) {
            Ok(_) => {
                info!(file, "Rotation script is valid");
                println!("Rotation script is valid");
                Ok(())
            }
            Err(e) => {
                warn!(file, error = %e, "Rotation script has errors");
                println!("Rotation script has errors:");
                println!("  {}", e);
                Err(e.to_string())
            }
        }
    }
}
