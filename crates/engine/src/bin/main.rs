//! WoW Simulation Engine CLI
//!
//! A high-performance combat simulation engine for World of Warcraft.
//!
//! # Usage
//!
//! ```bash
//! # Run a simulation with a spec config
//! engine sim --spec specs/hunter/beast-mastery.toml --iterations 10000
//!
//! # Validate a rotation script
//! engine validate --spec specs/hunter/beast-mastery.toml --rotation rotations/bm_st.rhai
//!
//! # Run benchmarks
//! engine bench --spec specs/hunter/beast-mastery.toml --iterations 100000
//! ```

use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use clap::{Parser, Subcommand};

use engine::cli::{SpecConfig, load_spec_config};
use engine::rotation::PredictiveRotation;
use engine::sim::{run_batch, run_batch_parallel, run_simulation, run_simulation_with_report, SimState};
use engine::util::{get_optimal_concurrency, FastRng};

#[derive(Parser)]
#[command(name = "engine")]
#[command(author = "wowlab")]
#[command(version)]
#[command(about = "WoW combat simulation engine", long_about = None)]
struct Cli {
    /// Number of threads for parallel execution (default: all cores)
    #[arg(short = 't', long, global = true)]
    threads: Option<usize>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a simulation
    Sim {
        /// Path to spec configuration file (TOML)
        #[arg(short, long)]
        spec: PathBuf,

        /// Path to rotation script (Rhai) - overrides spec default
        #[arg(short, long)]
        rotation: Option<PathBuf>,

        /// Number of iterations
        #[arg(short, long, default_value = "10000")]
        iterations: u32,

        /// Fight duration in seconds
        #[arg(short, long, default_value = "300.0")]
        duration: f32,

        /// Random seed (0 = random)
        #[arg(long, default_value = "0")]
        seed: u64,

        /// Output format (text, json)
        #[arg(short, long, default_value = "text")]
        output: String,

        /// Run simulations in parallel using all CPU cores
        #[arg(short, long)]
        parallel: bool,

        /// Generate detailed action report (single iteration, JSON output)
        #[arg(long)]
        report: bool,
    },

    /// Validate a rotation script without running simulation
    Validate {
        /// Path to spec configuration file (TOML)
        #[arg(short, long)]
        spec: PathBuf,

        /// Path to rotation script (Rhai)
        #[arg(short, long)]
        rotation: PathBuf,
    },

    /// Run performance benchmarks
    Bench {
        /// Path to spec configuration file (TOML)
        #[arg(short, long)]
        spec: PathBuf,

        /// Path to rotation script (Rhai) - overrides spec default
        #[arg(short, long)]
        rotation: Option<PathBuf>,

        /// Number of iterations
        #[arg(short, long, default_value = "100000")]
        iterations: u32,

        /// Fight duration in seconds
        #[arg(short, long, default_value = "300.0")]
        duration: f32,

        /// Show detailed rotation statistics
        #[arg(long)]
        stats: bool,

        /// Run simulations in parallel using all CPU cores
        #[arg(short, long)]
        parallel: bool,
    },

    /// List available specs
    List {
        /// Directory containing spec configs
        #[arg(short, long, default_value = "specs")]
        dir: PathBuf,
    },
}

fn main() {
    let cli = Cli::parse();

    // Configure rayon thread pool
    // Default to P-cores only on Apple Silicon, physical cores on x86
    let threads = cli.threads.unwrap_or_else(get_optimal_concurrency);
    rayon::ThreadPoolBuilder::new()
        .num_threads(threads)
        .build_global()
        .expect("Failed to configure thread pool");

    match cli.command {
        Commands::Sim {
            spec,
            rotation,
            iterations,
            duration,
            seed,
            output,
            parallel,
            report,
        } => {
            run_sim(&spec, rotation.as_deref(), iterations, duration, seed, &output, parallel, report);
        }

        Commands::Validate { spec, rotation } => {
            validate_rotation(&spec, &rotation);
        }

        Commands::Bench {
            spec,
            rotation,
            iterations,
            duration,
            stats,
            parallel,
        } => {
            run_bench(&spec, rotation.as_deref(), iterations, duration, stats, parallel);
        }

        Commands::List { dir } => {
            list_specs(&dir);
        }
    }
}

fn run_sim(
    spec_path: &Path,
    rotation_path: Option<&Path>,
    iterations: u32,
    duration: f32,
    seed: u64,
    output: &str,
    parallel: bool,
    report: bool,
) {
    // Load spec config
    let spec_config = match load_spec_config(spec_path) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error loading spec config: {}", e);
            std::process::exit(1);
        }
    };

    // Build sim config
    let mut config = match spec_config.to_sim_config() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error building sim config: {}", e);
            std::process::exit(1);
        }
    };
    config.duration = duration;
    config.finalize();

    // Load rotation script
    let rotation_script = match load_rotation_script(&spec_config, rotation_path) {
        Ok(script) => script,
        Err(e) => {
            eprintln!("Error loading rotation: {}", e);
            std::process::exit(1);
        }
    };

    // Validate rotation compiles (for parallel mode, each thread recompiles)
    if let Err(e) = PredictiveRotation::compile(&rotation_script, &config) {
        eprintln!("Error compiling rotation: {}", e);
        std::process::exit(1);
    }

    let actual_seed = if seed == 0 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64
    } else {
        seed
    };

    // Report mode: run single simulation with detailed action logging
    if report {
        let mut rotation = PredictiveRotation::compile(&rotation_script, &config).unwrap();
        let mut state = SimState::new(&config);
        let mut rng = FastRng::new(actual_seed);

        let report = run_simulation_with_report(
            &mut state,
            &config,
            &mut rng,
            &mut rotation,
            &spec_config.spec.name,
        );

        println!("{}", serde_json::to_string_pretty(&report).unwrap());
        return;
    }

    // Run simulation
    let start = Instant::now();
    let result = if parallel {
        run_batch_parallel(&config, &rotation_script, iterations, actual_seed)
    } else {
        let mut rotation = PredictiveRotation::compile(&rotation_script, &config).unwrap();
        let mut state = SimState::new(&config);
        let mut rng = FastRng::new(actual_seed);
        run_batch(&mut state, &config, &mut rng, &mut rotation, iterations, actual_seed)
    };
    let elapsed = start.elapsed();

    // Output results
    match output {
        "json" => {
            println!("{}", serde_json::to_string_pretty(&result).unwrap());
        }
        _ => {
            println!("=== Simulation Results ===\n");
            println!("Spec: {}", spec_config.spec.name);
            println!("Duration: {}s", duration);
            println!("Iterations: {}", iterations);
            if parallel {
                println!("Mode: parallel ({} threads)", rayon::current_num_threads());
            }
            println!();
            println!("DPS: {:.1} (std: {:.1})", result.mean_dps, result.std_dps);
            println!("Min: {:.1} / Max: {:.1}", result.min_dps, result.max_dps);
            println!();
            println!("Time: {:?}", elapsed);
            println!(
                "Throughput: {:.2}M sims/sec",
                iterations as f64 / elapsed.as_secs_f64() / 1_000_000.0
            );
        }
    }
}

fn validate_rotation(spec_path: &Path, rotation_path: &Path) {
    // Load spec config
    let spec_config = match load_spec_config(spec_path) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error loading spec config: {}", e);
            std::process::exit(1);
        }
    };

    // Build sim config (needed for rotation compilation)
    let config = match spec_config.to_sim_config() {
        Ok(mut config) => {
            config.finalize();
            config
        }
        Err(e) => {
            eprintln!("Error building sim config: {}", e);
            std::process::exit(1);
        }
    };

    // Load rotation script
    let rotation_script = match fs::read_to_string(rotation_path) {
        Ok(script) => script,
        Err(e) => {
            eprintln!("Error reading rotation file: {}", e);
            std::process::exit(1);
        }
    };

    // Compile rotation
    match PredictiveRotation::compile(&rotation_script, &config) {
        Ok(rotation) => {
            println!("Rotation valid!");
            println!("  Rules: {}", rotation.rule_count());
            println!("  Conditions: {}", rotation.condition_count());

            // List spells referenced
            println!("\nSpells available:");
            for spell in &config.spells {
                println!("  - {} (id: {})", spell.name, spell.id);
            }
            println!("\nAuras available:");
            for aura in &config.auras {
                println!("  - {} (id: {})", aura.name, aura.id);
            }
        }
        Err(e) => {
            eprintln!("Rotation invalid: {}", e);
            std::process::exit(1);
        }
    }
}

fn run_bench(
    spec_path: &Path,
    rotation_path: Option<&Path>,
    iterations: u32,
    duration: f32,
    show_stats: bool,
    parallel: bool,
) {
    // Load spec config
    let spec_config = match load_spec_config(spec_path) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error loading spec config: {}", e);
            std::process::exit(1);
        }
    };

    // Build sim config
    let mut config = match spec_config.to_sim_config() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error building sim config: {}", e);
            std::process::exit(1);
        }
    };
    config.duration = duration;
    config.finalize();

    // Load rotation script
    let rotation_script = match load_rotation_script(&spec_config, rotation_path) {
        Ok(script) => script,
        Err(e) => {
            eprintln!("Error loading rotation: {}", e);
            std::process::exit(1);
        }
    };

    // Compile rotation
    let mut rotation = match PredictiveRotation::compile(&rotation_script, &config) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Error compiling rotation: {}", e);
            std::process::exit(1);
        }
    };

    println!("=== Engine Benchmark ===\n");
    println!("Spec: {}", spec_config.spec.name);
    println!("Rotation: {} rules", rotation.rule_count());
    if parallel {
        println!("Mode: parallel ({} threads)", rayon::current_num_threads());
    }

    // Create state and RNG
    let mut state = SimState::new(&config);
    let mut rng = FastRng::new(12345);

    // Single sim for warmup and display
    rotation.reset();
    let result = run_simulation(&mut state, &config, &mut rng, &mut rotation);
    println!(
        "Single {}s sim: {} casts, {:.0} DPS",
        duration, result.casts, result.dps
    );

    // Warmup
    if parallel {
        let _ = run_batch_parallel(&config, &rotation_script, 1000, 0);
    } else {
        let _ = run_batch(&mut state, &config, &mut rng, &mut rotation, 1000, 0);
        rotation.reset_stats();
    }

    // Main benchmark
    let start = Instant::now();
    let result = if parallel {
        run_batch_parallel(&config, &rotation_script, iterations, 0)
    } else {
        run_batch(&mut state, &config, &mut rng, &mut rotation, iterations, 0)
    };
    let elapsed = start.elapsed();
    let sims_per_sec = iterations as f64 / elapsed.as_secs_f64();

    println!();
    println!("--- Benchmark Results ---");
    println!("Iterations: {}", iterations);
    println!("Time: {:?}", elapsed);
    println!("Throughput: {:.2}M sims/sec", sims_per_sec / 1_000_000.0);
    println!("Avg DPS: {:.0}", result.mean_dps);

    if show_stats && !parallel {
        let stats = rotation.stats();
        println!();
        println!("--- Predictive Gating Stats ---");
        let total = stats.evaluations + stats.skipped;
        println!("Total condition checks: {}", total);
        println!(
            "  Evaluated: {} ({:.1}%)",
            stats.evaluations,
            100.0 - stats.eval_savings()
        );
        println!("  Skipped:   {} ({:.1}%)", stats.skipped, stats.eval_savings());
    }
}

fn list_specs(dir: &Path) {
    if !dir.exists() {
        eprintln!("Specs directory not found: {}", dir.display());
        std::process::exit(1);
    }

    println!("Available specs:\n");

    fn visit_dir(dir: &Path, indent: usize) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    println!(
                        "{}{}/",
                        " ".repeat(indent),
                        path.file_name().unwrap().to_string_lossy()
                    );
                    visit_dir(&path, indent + 2);
                } else if path.extension().map(|e| e == "toml").unwrap_or(false) {
                    // Try to load and show spec name
                    if let Ok(config) = load_spec_config(&path) {
                        println!(
                            "{}{} - {} ({})",
                            " ".repeat(indent),
                            path.file_name().unwrap().to_string_lossy(),
                            config.spec.name,
                            config.spec.class
                        );
                    } else {
                        println!(
                            "{}{}",
                            " ".repeat(indent),
                            path.file_name().unwrap().to_string_lossy()
                        );
                    }
                }
            }
        }
    }

    visit_dir(dir, 0);
}

fn load_rotation_script(spec_config: &SpecConfig, rotation_path: Option<&Path>) -> Result<String, String> {
    if let Some(path) = rotation_path {
        fs::read_to_string(path).map_err(|e| format!("Failed to read rotation file: {}", e))
    } else if let Some(ref default_rotation) = spec_config.spec.default_rotation {
        // Try to load from file path relative to spec
        fs::read_to_string(default_rotation)
            .map_err(|e| format!("Failed to read default rotation '{}': {}", default_rotation, e))
    } else if let Some(ref inline_rotation) = spec_config.rotation {
        Ok(inline_rotation.script.clone())
    } else {
        Err("No rotation specified. Use --rotation or define one in the spec config.".to_string())
    }
}
