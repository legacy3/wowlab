use super::{DamageBreakdown, StatsCollector};
#[cfg(feature = "parallel")]
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
    #[cfg(feature = "parallel")]
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
    #[cfg(feature = "parallel")]
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

    #[cfg(feature = "parallel")]
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
