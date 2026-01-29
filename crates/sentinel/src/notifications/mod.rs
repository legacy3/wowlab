pub mod events;
mod receiver;

pub use events::NotificationEvent;
pub use receiver::run as run_receiver;

use tokio::sync::mpsc;

/// A notification to be sent to subscribed Discord channels.
#[derive(Debug, Clone)]
pub struct Notification {
    /// The type of event this notification represents.
    pub event: NotificationEvent,
    /// The title of the notification embed.
    pub title: String,
    /// The description/body of the notification embed.
    pub description: String,
    /// Optional URL to link in the embed title.
    pub url: Option<String>,
    /// Additional fields to display in the embed (name, value).
    pub fields: Vec<(String, String)>,
    /// The embed color (defaults to event type color if not specified).
    pub color: u32,
    /// Optional content to post as a threaded reply under the main message.
    pub thread_content: Option<String>,
    /// Optional name for the thread (defaults to "AI Summary" if not set).
    pub thread_name: Option<String>,
}

impl Notification {
    /// Create a new notification with the given event type, title, and description.
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

    /// Set the URL for the embed title.
    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }

    /// Add a field to the embed.
    pub fn field(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.fields.push((name.into(), value.into()));
        self
    }

    /// Override the default color.
    pub fn color(mut self, color: u32) -> Self {
        self.color = color;
        self
    }

    /// Set content to be posted as a threaded reply.
    pub fn thread_content(mut self, content: impl Into<String>) -> Self {
        self.thread_content = Some(content.into());
        self
    }

    /// Set the name for the thread.
    pub fn thread_name(mut self, name: impl Into<String>) -> Self {
        self.thread_name = Some(name.into());
        self
    }
}

/// Type alias for the notification sender.
pub type NotificationSender = mpsc::UnboundedSender<Notification>;

/// Type alias for the notification receiver.
pub type NotificationReceiver = mpsc::UnboundedReceiver<Notification>;

/// Create a new notification channel pair.
pub fn channel() -> (NotificationSender, NotificationReceiver) {
    mpsc::unbounded_channel()
}
