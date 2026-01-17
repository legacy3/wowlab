//! Pretty CLI output using indicatif, tabled, and console.

use console::{style, Style};
use indicatif::{ProgressBar, ProgressStyle, HumanDuration};
use tabled::{Table, Tabled, settings::{Style as TableStyle, Modify, object::Rows, Alignment}};
use std::time::{Duration, Instant};

use crate::sim::{Simulation, BatchResults};
use super::OutputFormat;

/// Get number of CPU cores available for parallel simulation
pub fn num_cores() -> usize {
    rayon::current_num_threads()
}

/// Terminal output handler for pretty CLI display.
pub struct Output {
    colors: ColorScheme,
}

/// Color scheme for output styling.
struct ColorScheme {
    title: Style,
    label: Style,
    value: Style,
    success: Style,
    warning: Style,
}

impl Default for ColorScheme {
    fn default() -> Self {
        Self {
            title: Style::new().bold().cyan(),
            label: Style::new().dim(),
            value: Style::new().bold().white(),
            success: Style::new().green(),
            warning: Style::new().yellow(),
        }
    }
}

impl Output {
    /// Create a new output handler.
    pub fn new() -> Self {
        Self {
            colors: ColorScheme::default(),
        }
    }

    /// Print a styled header.
    pub fn header(&self, text: &str) {
        let styled = self.colors.title.apply_to(format!("▸ {}", text));
        eprintln!("{}", styled);
    }

    /// Print a key-value pair.
    pub fn kv(&self, key: &str, value: &str) {
        eprintln!(
            "  {} {}",
            self.colors.label.apply_to(format!("{}:", key)),
            self.colors.value.apply_to(value)
        );
    }

    /// Print a success message.
    #[allow(dead_code)]
    pub fn success(&self, text: &str) {
        let styled = self.colors.success.apply_to(format!("✓ {}", text));
        eprintln!("{}", styled);
    }

    /// Print a warning message.
    #[allow(dead_code)]
    pub fn warn(&self, text: &str) {
        let styled = self.colors.warning.apply_to(format!("⚠ {}", text));
        eprintln!("{}", styled);
    }

    /// Print a blank line.
    pub fn blank(&self) {
        eprintln!();
    }

    /// Create a progress bar for batch simulations.
    pub fn progress_bar(&self, total: u64) -> SimProgress {
        SimProgress::new(total)
    }

    /// Create a progress bar for parallel batch simulations.
    pub fn parallel_progress_bar(&self, total: u64, num_threads: usize) -> ProgressBar {
        let pb = ProgressBar::new(total);
        pb.set_style(
            ProgressStyle::default_bar()
                .template(&format!(
                    "{{spinner:.cyan}} [{{elapsed_precise}}] [{{bar:40.cyan/dim}}] {{pos}}/{{len}} ({{percent}}%) | {} cores | {{msg}}",
                    num_threads
                ))
                .unwrap()
                .progress_chars("━━╸")
        );
        pb.enable_steady_tick(Duration::from_millis(100));
        pb
    }

    /// Display single simulation results.
    pub fn single_result(&self, sim: &Simulation, format: OutputFormat) {
        match format {
            OutputFormat::Text => self.single_result_text(sim),
            OutputFormat::Json => self.single_result_json(sim),
            OutputFormat::Csv => self.single_result_csv(sim),
        }
    }

    /// Display batch simulation results.
    pub fn batch_result(&self, results: &BatchResults, elapsed: Duration, format: OutputFormat) {
        match format {
            OutputFormat::Text => self.batch_result_text(results, elapsed),
            OutputFormat::Json => self.batch_result_json(results),
            OutputFormat::Csv => self.batch_result_csv(results),
        }
    }

    fn single_result_text(&self, sim: &Simulation) {
        self.header("Results");

        let rows = vec![
            ResultRow::new("DPS", format!("{:.2}", sim.dps())),
            ResultRow::new("Total Damage", format!("{:.0}", sim.total_damage())),
            ResultRow::new("Duration", format!("{:.1}s", sim.state.config.duration.as_secs_f32())),
        ];

        let table = Table::new(rows)
            .with(TableStyle::rounded())
            .with(Modify::new(Rows::new(1..)).with(Alignment::right()))
            .to_string();

        eprintln!("{}", table);
    }

    fn single_result_json(&self, sim: &Simulation) {
        let json = serde_json::json!({
            "dps": format!("{:.2}", sim.dps()).parse::<f64>().unwrap_or(0.0),
            "damage": sim.total_damage() as u64,
            "duration": sim.state.config.duration.as_secs_f32(),
        });
        println!("{}", serde_json::to_string_pretty(&json).unwrap());
    }

    fn single_result_csv(&self, sim: &Simulation) {
        println!("dps,damage,duration");
        println!("{:.2},{:.0},{:.2}",
            sim.dps(),
            sim.total_damage(),
            sim.state.config.duration.as_secs_f32(),
        );
    }

    fn batch_result_text(&self, results: &BatchResults, elapsed: Duration) {
        self.blank();
        self.header("Batch Results");

        let rows = vec![
            ResultRow::new("Mean DPS", format!("{:.2}", results.mean_dps)),
            ResultRow::new("Std Dev", format!("±{:.2}", results.std_dev)),
            ResultRow::new("Min DPS", format!("{:.2}", results.min_dps)),
            ResultRow::new("Max DPS", format!("{:.2}", results.max_dps)),
            ResultRow::new("Median", format!("{:.2}", results.median())),
            ResultRow::new("CV", format!("{:.2}%", results.cv() * 100.0)),
        ];

        let table = Table::new(rows)
            .with(TableStyle::rounded())
            .with(Modify::new(Rows::new(1..)).with(Alignment::right()))
            .to_string();

        eprintln!("{}", table);

        // Summary line with core count
        let iter_per_sec = results.iterations as f64 / elapsed.as_secs_f64();
        let num_cores = rayon::current_num_threads();
        let summary = format!(
            "{} iterations in {} ({:.0}/sec) using {} cores",
            style(results.iterations).bold(),
            style(HumanDuration(elapsed)).dim(),
            iter_per_sec,
            style(num_cores).cyan().bold()
        );
        eprintln!("\n  {}", summary);
    }

    fn batch_result_json(&self, results: &BatchResults) {
        let json = serde_json::json!({
            "iterations": results.iterations,
            "mean_dps": format!("{:.2}", results.mean_dps).parse::<f64>().unwrap_or(0.0),
            "std_dev": format!("{:.2}", results.std_dev).parse::<f64>().unwrap_or(0.0),
            "min_dps": format!("{:.2}", results.min_dps).parse::<f64>().unwrap_or(0.0),
            "max_dps": format!("{:.2}", results.max_dps).parse::<f64>().unwrap_or(0.0),
            "median_dps": format!("{:.2}", results.median()).parse::<f64>().unwrap_or(0.0),
            "cv": format!("{:.4}", results.cv()).parse::<f64>().unwrap_or(0.0),
            "parallelism": {
                "cores": rayon::current_num_threads(),
            },
        });
        println!("{}", serde_json::to_string_pretty(&json).unwrap());
    }

    fn batch_result_csv(&self, results: &BatchResults) {
        println!("iteration,dps");
        for (i, &dps) in results.dps_values.iter().enumerate() {
            println!("{},{:.2}", i + 1, dps);
        }
    }

    /// Print simulation configuration summary.
    pub fn config_summary(&self, spec: &str, duration: f32, iterations: u32, targets: usize) {
        self.header("Configuration");
        self.kv("Spec", spec);
        self.kv("Duration", &format!("{:.0}s", duration));
        self.kv("Iterations", &iterations.to_string());
        if targets > 1 {
            self.kv("Targets", &targets.to_string());
        }
        if iterations > 1 {
            let cores = rayon::current_num_threads();
            self.kv("Parallelism", &format!("{} cores", cores));
        }
        self.blank();
    }
}

impl Default for Output {
    fn default() -> Self {
        Self::new()
    }
}

/// Progress bar wrapper for simulations.
pub struct SimProgress {
    bar: ProgressBar,
    start: Instant,
}

impl SimProgress {
    fn new(total: u64) -> Self {
        let bar = ProgressBar::new(total);
        bar.set_style(
            ProgressStyle::default_bar()
                .template("{spinner:.cyan} [{elapsed_precise}] [{bar:40.cyan/dim}] {pos}/{len} ({percent}%) {msg}")
                .unwrap()
                .progress_chars("━━╸")
        );
        bar.enable_steady_tick(Duration::from_millis(100));

        Self {
            bar,
            start: Instant::now(),
        }
    }

    /// Update progress.
    pub fn inc(&self) {
        self.bar.inc(1);
    }

    /// Set current message (e.g., current DPS).
    pub fn set_message(&self, msg: impl Into<std::borrow::Cow<'static, str>>) {
        self.bar.set_message(msg);
    }

    /// Finish with a message.
    pub fn finish(&self) {
        self.bar.finish_and_clear();
    }

    /// Get elapsed time.
    pub fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }
}

/// Row for results table.
#[derive(Tabled)]
struct ResultRow {
    #[tabled(rename = "Metric")]
    metric: String,
    #[tabled(rename = "Value")]
    value: String,
}

impl ResultRow {
    fn new(metric: &str, value: String) -> Self {
        Self {
            metric: metric.to_string(),
            value,
        }
    }
}

/// Print the engine banner.
pub fn banner() {
    let version = env!("CARGO_PKG_VERSION");
    let banner = format!(
        "{} {}",
        style("WoW Lab Engine").bold().cyan(),
        style(format!("v{}", version)).dim()
    );
    eprintln!("{}\n", banner);
}
