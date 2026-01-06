use clap::{Parser, Subcommand, ValueEnum};

#[derive(Parser, Debug)]
#[command(name = "engine")]
#[command(about = "WoW Combat Simulation Engine", long_about = None)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a simulation
    Sim {
        /// Spec to simulate
        #[arg(short, long)]
        spec: SpecArg,

        /// Fight duration in seconds
        #[arg(short, long, default_value = "300")]
        duration: f32,

        /// Number of iterations
        #[arg(short, long, default_value = "1000")]
        iterations: u32,

        /// Number of targets
        #[arg(short, long, default_value = "1")]
        targets: usize,

        /// Number of threads (defaults to optimal for your CPU)
        #[arg(long)]
        threads: Option<usize>,

        /// Random seed
        #[arg(long)]
        seed: Option<u64>,

        /// Output format
        #[arg(short, long, default_value = "text")]
        output: OutputFormat,

        /// Rotation script file
        #[arg(long)]
        rotation: Option<String>,

        /// Gear profile file
        #[arg(long)]
        gear: Option<String>,

        /// Tuning override files (can be specified multiple times)
        #[arg(long = "tuning", value_name = "FILE")]
        tuning: Vec<String>,

        /// Enable detailed trace
        #[arg(long)]
        trace: bool,
    },

    /// List available specs
    Specs,

    /// Validate a rotation script
    Validate {
        /// Rotation script file
        #[arg(short, long)]
        file: String,
    },

    /// Show version info
    Version,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
pub enum SpecArg {
    BmHunter,
}

impl SpecArg {
    pub fn to_spec_id(&self) -> crate::types::SpecId {
        match self {
            SpecArg::BmHunter => crate::types::SpecId::BeastMastery,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, ValueEnum)]
pub enum OutputFormat {
    #[default]
    Text,
    Json,
    Csv,
}
