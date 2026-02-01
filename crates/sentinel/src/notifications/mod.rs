pub mod events;
mod receiver;

pub use events::NotificationEvent;
pub use receiver::run as run_receiver;

use tokio::sync::mpsc;

#[derive(Debug, Clone)]
pub struct Notification {
    pub event: NotificationEvent,
    pub title: String,
    pub description: String,
    pub url: Option<String>,
    pub fields: Vec<(String, String)>,
    pub color: u32,
    pub thread_content: Option<String>,
    pub thread_name: Option<String>,
}

impl Notification {
    pub fn new(
        event: NotificationEvent,
        title: impl Into<String>,
        description: impl Into<String>,
    ) -> Self {
        Self {
            color: event.color(),
            event,
            title: title.into(),
            description: description.into(),
            url: None,
            fields: Vec::new(),
            thread_content: None,
            thread_name: None,
        }
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }

    pub fn field(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.fields.push((name.into(), value.into()));
        self
    }

    pub fn color(mut self, color: u32) -> Self {
        self.color = color;
        self
    }

    pub fn thread_content(mut self, content: impl Into<String>) -> Self {
        self.thread_content = Some(content.into());
        self
    }

    pub fn thread_name(mut self, name: impl Into<String>) -> Self {
        self.thread_name = Some(name.into());
        self
    }
}

pub type NotificationSender = mpsc::UnboundedSender<Notification>;
pub type NotificationReceiver = mpsc::UnboundedReceiver<Notification>;

pub fn channel() -> (NotificationSender, NotificationReceiver) {
    mpsc::unbounded_channel()
}
