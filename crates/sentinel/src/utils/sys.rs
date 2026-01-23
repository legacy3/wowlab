#[cfg(target_os = "linux")]
mod inner {
    /// RSS memory in megabytes from `/proc/self/statm`.
    pub fn read_memory_mb() -> f64 {
        std::fs::read_to_string("/proc/self/statm")
            .ok()
            .and_then(|s| s.split_whitespace().nth(1).and_then(|p| p.parse::<u64>().ok()))
            .map(|pages| pages as f64 * 4.0 / 1024.0)
            .unwrap_or(0.0)
    }

    /// 1/5/15-minute load averages from `/proc/loadavg`.
    pub fn read_load_average() -> [f64; 3] {
        std::fs::read_to_string("/proc/loadavg")
            .ok()
            .and_then(|s| {
                let mut parts = s.split_whitespace();
                let one = parts.next()?.parse::<f64>().ok()?;
                let five = parts.next()?.parse::<f64>().ok()?;
                let fifteen = parts.next()?.parse::<f64>().ok()?;
                Some([one, five, fifteen])
            })
            .unwrap_or([0.0; 3])
    }

    /// CPU times (total, idle) from `/proc/stat`.
    fn read_cpu_times() -> Option<(u64, u64)> {
        let stat = std::fs::read_to_string("/proc/stat").ok()?;
        let cpu = stat.lines().find(|l| l.starts_with("cpu "))?;
        let mut parts = cpu
            .split_whitespace()
            .skip(1)
            .filter_map(|v| v.parse::<u64>().ok());
        let user = parts.next()?;
        let nice = parts.next()?;
        let system = parts.next()?;
        let idle = parts.next()?;
        let total = user + nice + system + idle;
        Some((total, idle))
    }

    /// CPU usage percentage sampled over 100ms.
    pub async fn cpu_usage_percent() -> f64 {
        let Some((total1, idle1)) = read_cpu_times() else {
            return 0.0;
        };
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        let Some((total2, idle2)) = read_cpu_times() else {
            return 0.0;
        };
        let total_delta = total2.saturating_sub(total1);
        if total_delta == 0 {
            return 0.0;
        }
        let idle_delta = idle2.saturating_sub(idle1);
        100.0 * (total_delta - idle_delta) as f64 / total_delta as f64
    }

    /// System total and available memory in MB from `/proc/meminfo`.
    pub fn read_os_memory_mb() -> (f64, f64) {
        let Some(meminfo) = std::fs::read_to_string("/proc/meminfo").ok() else {
            return (0.0, 0.0);
        };
        let mut total = 0.0;
        let mut available = 0.0;
        for line in meminfo.lines() {
            if line.starts_with("MemTotal:") {
                total = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|v| v.parse::<f64>().ok())
                    .unwrap_or(0.0)
                    / 1024.0;
            } else if line.starts_with("MemAvailable:") {
                available = line
                    .split_whitespace()
                    .nth(1)
                    .and_then(|v| v.parse::<f64>().ok())
                    .unwrap_or(0.0)
                    / 1024.0;
            }
        }
        (total, available)
    }
}

#[cfg(not(target_os = "linux"))]
mod inner {
    pub fn read_memory_mb() -> f64 {
        0.0
    }

    pub fn read_load_average() -> [f64; 3] {
        [0.0; 3]
    }

    pub async fn cpu_usage_percent() -> f64 {
        0.0
    }

    pub fn read_os_memory_mb() -> (f64, f64) {
        (0.0, 0.0)
    }
}

pub use inner::cpu_usage_percent;
pub use inner::read_load_average;
pub use inner::read_memory_mb;
pub use inner::read_os_memory_mb;

/// Format seconds into a human-readable "Xd Yh Zm" string.
pub fn format_uptime(secs: u64) -> String {
    let days = secs / 86400;
    let hours = (secs % 86400) / 3600;
    let minutes = (secs % 3600) / 60;

    if days > 0 {
        format!("{}d {}h {}m", days, hours, minutes)
    } else if hours > 0 {
        format!("{}h {}m", hours, minutes)
    } else {
        format!("{}m", minutes)
    }
}
