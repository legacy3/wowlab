//! Thread pool for parallel simulation execution
#![allow(dead_code)]

use super::runner::SimRunner;
use crate::app::NodeStats;
use std::sync::{
    atomic::{AtomicU32, AtomicU64, Ordering},
    Arc,
};
use tokio::runtime::Handle;
use tokio::sync::mpsc;

/// Work item to be processed
pub struct WorkItem {
    pub chunk_id: uuid::Uuid,
    pub config_json: String,
    pub iterations: u32,
    pub seed_offset: u64,
}

/// Result of simulation work
pub struct WorkResult {
    pub chunk_id: uuid::Uuid,
    pub result: serde_json::Value,
    pub elapsed_ms: u64,
}

/// Pool of workers for running simulations
pub struct WorkerPool {
    max_workers: usize,
    active_workers: Arc<AtomicU32>,
    completed_chunks: Arc<AtomicU64>,
    sims_completed: Arc<AtomicU64>,
    work_tx: Option<mpsc::Sender<WorkItem>>,
    result_rx: Option<mpsc::Receiver<WorkResult>>,
    cached_stats: NodeStats,
}

impl WorkerPool {
    /// Create a new worker pool (doesn't start workers until start() is called)
    pub fn new(max_workers: usize) -> Self {
        Self {
            max_workers,
            active_workers: Arc::new(AtomicU32::new(0)),
            completed_chunks: Arc::new(AtomicU64::new(0)),
            sims_completed: Arc::new(AtomicU64::new(0)),
            work_tx: None,
            result_rx: None,
            cached_stats: NodeStats {
                max_workers: max_workers as u32,
                ..Default::default()
            },
        }
    }

    /// Start the worker pool with the given runtime handle
    pub fn start(&mut self, handle: &Handle) {
        let (work_tx, mut work_rx) = mpsc::channel::<WorkItem>(100);
        let (result_tx, result_rx) = mpsc::channel::<WorkResult>(100);

        self.work_tx = Some(work_tx);
        self.result_rx = Some(result_rx);

        let active = Arc::clone(&self.active_workers);
        let completed = Arc::clone(&self.completed_chunks);
        let sims = Arc::clone(&self.sims_completed);

        // Work distribution task - runs on the tokio runtime
        handle.spawn(async move {
            while let Some(item) = work_rx.recv().await {
                active.fetch_add(1, Ordering::SeqCst);

                let start = std::time::Instant::now();
                let runner = SimRunner::new();

                match runner.run(&item.config_json, item.iterations, item.seed_offset) {
                    Ok(result) => {
                        let elapsed_ms = start.elapsed().as_millis() as u64;
                        sims.fetch_add(item.iterations as u64, Ordering::SeqCst);
                        completed.fetch_add(1, Ordering::SeqCst);

                        let _ = result_tx
                            .send(WorkResult {
                                chunk_id: item.chunk_id,
                                result,
                                elapsed_ms,
                            })
                            .await;
                    }
                    Err(e) => {
                        tracing::error!("Simulation failed: {}", e);
                    }
                }

                active.fetch_sub(1, Ordering::SeqCst);
            }
        });
    }

    /// Submit work to the pool
    pub async fn submit(&self, item: WorkItem) -> Result<(), mpsc::error::SendError<WorkItem>> {
        if let Some(ref tx) = self.work_tx {
            tx.send(item).await
        } else {
            Err(mpsc::error::SendError(item))
        }
    }

    /// Get current statistics
    pub fn stats(&self) -> NodeStats {
        let completed = self.completed_chunks.load(Ordering::SeqCst);
        let active = self.active_workers.load(Ordering::SeqCst);
        let sims = self.sims_completed.load(Ordering::SeqCst);

        // Calculate sims per second (simplified)
        let sims_per_second = if completed > 0 {
            sims as f64 / 60.0
        } else {
            0.0
        };

        NodeStats {
            active_jobs: active,
            completed_chunks: completed,
            sims_per_second,
            busy_workers: active,
            max_workers: self.max_workers as u32,
            cpu_usage: active as f32 / self.max_workers as f32,
        }
    }

    /// Store stats for later retrieval (used during settings view)
    pub fn set_cached_stats(&mut self, stats: NodeStats) {
        self.cached_stats = stats;
    }

    /// Get cached stats (for restoring after settings view)
    pub fn get_cached_stats(&self) -> NodeStats {
        self.cached_stats.clone()
    }
}
