use super::{banner, Args, Command, GearConfig, Output, OutputFormat, SpecArg};
use crate::actor::Player;
use crate::handler::{create_handler, SpecHandler};
use crate::rotation::Rotation;
use crate::sim::{BatchResults, BatchRunner, ExactProgress, SimConfig, Simulation};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tracing::{debug, info, instrument};

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
                threads: _, // Handled in main.rs before run()
            } => Self::run_sim(
                spec, duration, iterations, targets, seed, output, rotation, gear, trace,
            ),

            Command::Specs => Self::list_specs(),

            Command::Validate { file } => Self::validate_rotation(&file),

            Command::Version => {
                println!("engine_new v{}", env!("CARGO_PKG_VERSION"));
                Ok(())
            }
        }
    }

    #[instrument(skip(gear_file, rotation_file), fields(spec = ?spec, iterations, targets, duration))]
    #[allow(clippy::too_many_arguments)]
    fn run_sim(
        spec: SpecArg,
        duration: f32,
        iterations: u32,
        targets: usize,
        seed: Option<u64>,
        output_format: OutputFormat,
        rotation_file: Option<String>,
        gear_file: Option<String>,
        trace: bool,
    ) -> Result<(), String> {
        let out = Output::new();

        // Show banner and config for text output
        if matches!(output_format, OutputFormat::Text) {
            banner();
            out.config_summary(&format!("{:?}", spec), duration, iterations, targets);
        }

        info!(spec = ?spec, iterations, targets, duration_secs = duration, "Starting simulation");

        let spec_id = spec.to_spec_id();

        // Load rotation script
        let rotation_script = Self::load_rotation_script(spec, rotation_file.as_deref())?;

        // Create handler with rotation
        let handler = create_handler(spec_id, &rotation_script)?;

        // Load gear
        let gear = if let Some(ref path) = gear_file {
            debug!(path, "Loading gear configuration");
            GearConfig::from_file(path)?
        } else {
            debug!("Using default gear configuration");
            GearConfig::default()
        };

        // Setup player
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

        // Setup config
        let mut config = SimConfig::default().with_duration(duration);

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
            let mut sim = Simulation::new(handler, config, player);
            sim.run();

            info!(
                dps = sim.dps(),
                damage = sim.total_damage(),
                "Simulation complete"
            );
            out.single_result(&sim, output_format);
        } else {
            debug!(iterations, "Running batch simulation");
            let (results, elapsed) =
                Self::run_batch(handler, config, player, iterations, &out, output_format);
            info!(
                mean_dps = results.mean_dps,
                std_dev = results.std_dev,
                iterations = results.iterations,
                "Batch simulation complete"
            );
            out.batch_result(&results, elapsed, output_format);
        }

        Ok(())
    }

    /// Run batch simulation in parallel across all CPU cores
    fn run_batch(
        handler: Arc<dyn SpecHandler>,
        config: SimConfig,
        player_template: Player,
        iterations: u32,
        out: &Output,
        format: OutputFormat,
    ) -> (BatchResults, Duration) {
        let num_threads = rayon::current_num_threads();

        // Create batch runner
        let runner =
            BatchRunner::with_handler(handler, config, player_template).with_iterations(iterations);

        // Create progress tracker
        let progress = Arc::new(ExactProgress::new(iterations));

        // Start progress display thread for text output
        let progress_handle = if matches!(format, OutputFormat::Text) {
            let pb = out.parallel_progress_bar(iterations as u64, num_threads);
            let progress_clone = Arc::clone(&progress);

            Some(thread::spawn(move || {
                loop {
                    let completed = progress_clone.completed();
                    if completed >= progress_clone.total() {
                        break;
                    }

                    pb.set_position(completed as u64);

                    // Update message with live stats
                    let throughput = progress_clone.throughput();
                    let mean = progress_clone.running_mean();

                    if completed > 0 {
                        pb.set_message(format!("~{:.0} DPS | {:.0} iter/s", mean, throughput));
                    }

                    thread::sleep(Duration::from_millis(50));
                }
                pb.finish_and_clear();
            }))
        } else {
            None
        };

        // Run parallel simulation
        let results = runner.run_with_progress(&progress);

        // Wait for progress thread to finish
        if let Some(handle) = progress_handle {
            let _ = handle.join();
        }

        let elapsed = progress.elapsed();

        info!(
            iterations,
            num_threads,
            throughput = %format!("{:.0}/sec", iterations as f64 / elapsed.as_secs_f64()),
            "Parallel batch complete"
        );

        (results, elapsed)
    }

    fn list_specs() -> Result<(), String> {
        println!("Available specs:");
        println!("  bm-hunter  - Beast Mastery Hunter");
        println!("  mm-hunter  - Marksmanship Hunter");
        Ok(())
    }

    /// Load rotation JSON from file or use default
    fn load_rotation_script(spec: SpecArg, path: Option<&str>) -> Result<String, String> {
        if let Some(p) = path {
            debug!(path = p, "Loading rotation file");
            std::fs::read_to_string(p).map_err(|e| format!("Failed to read rotation file: {}", e))
        } else {
            // Use default rotation for spec
            let default_path = match spec {
                SpecArg::BmHunter => "rotations/bm_hunter.json",
                SpecArg::MmHunter => "rotations/mm_hunter.json",
            };
            debug!(path = default_path, "Loading default rotation file");
            std::fs::read_to_string(default_path)
                .map_err(|e| format!("Failed to read default rotation '{}': {}", default_path, e))
        }
    }

    fn validate_rotation(file: &str) -> Result<(), String> {
        debug!(file, "Validating rotation file");
        let content =
            std::fs::read_to_string(file).map_err(|e| format!("Failed to read file: {}", e))?;

        // Parse JSON rotation
        let rotation = Rotation::from_json(&content)
            .map_err(|e| format!("Failed to parse rotation: {}", e))?;

        info!(name = %rotation.name, actions = rotation.actions.len(), "Parsed rotation");

        // Validation is parsing-only for now, as compilation requires spec-specific resolver
        println!(
            "Rotation '{}' is valid ({} actions)",
            rotation.name,
            rotation.actions.len()
        );
        println!("  Variables: {}", rotation.variables.len());
        println!("  Lists: {}", rotation.lists.len());

        // Note: Full compilation validation requires a spec resolver
        // Use `engine sim -s <spec> --rotation <file>` to test with a specific spec

        Ok(())
    }
}
