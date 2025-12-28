use super::runner::SimRunner;
use crate::app::NodeStats;
use std::sync::{
    atomic::{AtomicU32, AtomicU64, Ordering},
    Arc,
};
use tokio::runtime::Handle;
use tokio::sync::{mpsc, Semaphore};
use uuid::Uuid;

pub struct WorkItem {
    pub chunk_id: Uuid,
    pub config_json: String,
    pub iterations: u32,
    pub seed_offset: u64,
}

#[allow(dead_code)]
pub struct WorkResult {
    pub chunk_id: Uuid,
    pub result: serde_json::Value,
    pub elapsed_ms: u64,
}

pub struct WorkerPool {
    max_workers: usize,
    active_workers: Arc<AtomicU32>,
    completed_chunks: Arc<AtomicU64>,
    sims_completed: Arc<AtomicU64>,
    work_tx: Option<mpsc::Sender<WorkItem>>,
    result_rx: Option<mpsc::Receiver<WorkResult>>,
}

impl WorkerPool {
    pub fn new(max_workers: usize) -> Self {
        Self {
            max_workers,
            active_workers: Arc::new(AtomicU32::new(0)),
            completed_chunks: Arc::new(AtomicU64::new(0)),
            sims_completed: Arc::new(AtomicU64::new(0)),
            work_tx: None,
            result_rx: None,
        }
    }

    pub fn start(&mut self, handle: &Handle) {
        let (work_tx, mut work_rx) = mpsc::channel::<WorkItem>(100);
        let (result_tx, result_rx) = mpsc::channel::<WorkResult>(100);

        self.work_tx = Some(work_tx);
        self.result_rx = Some(result_rx);

        let semaphore = Arc::new(Semaphore::new(self.max_workers));
        let active = Arc::clone(&self.active_workers);
        let completed = Arc::clone(&self.completed_chunks);
        let sims = Arc::clone(&self.sims_completed);

        handle.spawn(async move {
            while let Some(item) = work_rx.recv().await {
                let permit = semaphore.clone().acquire_owned().await;
                let Ok(_permit) = permit else { break };

                let active = Arc::clone(&active);
                let completed = Arc::clone(&completed);
                let sims = Arc::clone(&sims);
                let result_tx = result_tx.clone();

                tokio::spawn(async move {
                    active.fetch_add(1, Ordering::Relaxed);

                    let start = std::time::Instant::now();
                    let config = item.config_json.clone();
                    let iterations = item.iterations;
                    let seed = item.seed_offset;

                    let result = tokio::task::spawn_blocking(move || {
                        SimRunner::run(&config, iterations, seed)
                    })
                    .await;

                    active.fetch_sub(1, Ordering::Relaxed);

                    match result {
                        Ok(Ok(sim_result)) => {
                            #[allow(clippy::cast_possible_truncation)]
                            let elapsed_ms = start.elapsed().as_millis() as u64;
                            sims.fetch_add(u64::from(item.iterations), Ordering::Relaxed);
                            completed.fetch_add(1, Ordering::Relaxed);

                            let _ = result_tx
                                .send(WorkResult {
                                    chunk_id: item.chunk_id,
                                    result: sim_result,
                                    elapsed_ms,
                                })
                                .await;
                        }
                        Ok(Err(e)) => tracing::error!("Simulation failed: {}", e),
                        Err(e) => tracing::error!("Task panicked: {}", e),
                    }
                });
            }
        });
    }

    #[allow(dead_code)]
    pub fn result_rx(&mut self) -> Option<mpsc::Receiver<WorkResult>> {
        self.result_rx.take()
    }

    #[allow(dead_code)]
    pub async fn submit(&self, item: WorkItem) -> Result<(), mpsc::error::SendError<WorkItem>> {
        match &self.work_tx {
            Some(tx) => tx.send(item).await,
            None => Err(mpsc::error::SendError(item)),
        }
    }

    #[allow(clippy::cast_possible_truncation, clippy::cast_precision_loss)]
    pub fn stats(&self) -> NodeStats {
        let completed = self.completed_chunks.load(Ordering::Relaxed);
        let active = self.active_workers.load(Ordering::Relaxed);
        let sims = self.sims_completed.load(Ordering::Relaxed);
        let max = self.max_workers as u32;

        NodeStats {
            active_jobs: active,
            completed_chunks: completed,
            sims_per_second: if completed > 0 {
                sims as f64 / 60.0
            } else {
                0.0
            },
            busy_workers: active,
            max_workers: max,
            cpu_usage: if max > 0 {
                active as f32 / max as f32
            } else {
                0.0
            },
        }
    }
}
