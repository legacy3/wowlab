use directories::ProjectDirs;
use std::path::PathBuf;
use std::sync::OnceLock;
use tokio::sync::mpsc;
use tracing::Level;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::Layer;

static UI_SENDER: OnceLock<mpsc::Sender<UiLogEntry>> = OnceLock::new();

pub fn log_dir() -> Option<PathBuf> {
    ProjectDirs::from("gg", "wowlab", "wowlab-node").map(|dirs| dirs.data_dir().join("logs"))
}

#[derive(Debug, Clone)]
pub struct UiLogEntry {
    pub level: Level,
    pub message: String,
}

pub fn init_with_ui() -> mpsc::Receiver<UiLogEntry> {
    let (tx, rx) = mpsc::channel(100);
    UI_SENDER.set(tx).ok();

    let env_filter = tracing_subscriber::EnvFilter::from_default_env()
        .add_directive("node=debug".parse().expect("valid directive"))
        .add_directive("node_core=debug".parse().expect("valid directive"))
        .add_directive("node_headless=debug".parse().expect("valid directive"))
        .add_directive("eframe=warn".parse().expect("valid directive"))
        .add_directive("egui=warn".parse().expect("valid directive"));

    let registry = tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_subscriber::fmt::layer().with_target(true))
        .with(UiLayer);

    if let Some(log_dir) = log_dir() {
        if std::fs::create_dir_all(&log_dir).is_ok() {
            let file_appender = tracing_appender::rolling::daily(&log_dir, "node.log");
            let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
            Box::leak(Box::new(guard));

            registry
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_ansi(false)
                        .with_target(true)
                        .with_writer(non_blocking),
                )
                .init();
            tracing::debug!("Logging to {log_dir:?}");
            return rx;
        }
    }

    registry.init();
    rx
}

pub fn init_headless() {
    let env_filter = tracing_subscriber::EnvFilter::from_default_env()
        .add_directive("node_core=debug".parse().expect("valid directive"))
        .add_directive("node_headless=info".parse().expect("valid directive"));

    let registry = tracing_subscriber::registry()
        .with(env_filter)
        .with(tracing_subscriber::fmt::layer().with_target(true));

    if let Some(log_dir) = log_dir() {
        if std::fs::create_dir_all(&log_dir).is_ok() {
            let file_appender = tracing_appender::rolling::daily(&log_dir, "node.log");
            let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);
            Box::leak(Box::new(guard));

            registry
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_ansi(false)
                        .with_target(true)
                        .with_writer(non_blocking),
                )
                .init();
            tracing::debug!("Logging to {log_dir:?}");
            return;
        }
    }

    registry.init();
}

struct UiLayer;

impl<S> Layer<S> for UiLayer
where
    S: tracing::Subscriber,
{
    fn on_event(
        &self,
        event: &tracing::Event<'_>,
        _ctx: tracing_subscriber::layer::Context<'_, S>,
    ) {
        let Some(sender) = UI_SENDER.get() else {
            return;
        };

        let level = *event.metadata().level();
        let mut visitor = MessageVisitor::default();
        event.record(&mut visitor);
        let _ = sender.try_send(UiLogEntry {
            level,
            message: visitor.message.unwrap_or_default(),
        });
    }
}

#[derive(Default)]
struct MessageVisitor {
    message: Option<String>,
}

impl tracing::field::Visit for MessageVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            self.message = Some(format!("{value:?}"));
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.message = Some(value.to_string());
        }
    }
}
