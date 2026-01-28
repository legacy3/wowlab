use std::sync::Arc;

use poise::serenity_prelude::{ChannelId, CreateEmbed, CreateMessage, Http};
use sqlx::{FromRow, PgPool};
use tokio::sync::mpsc;

use super::Notification;

#[derive(FromRow)]
struct SubscriptionRow {
    channel_id: String,
}

/// Async task that receives notifications and sends them to subscribed Discord channels.
///
/// This function loops indefinitely, receiving notifications from the channel and
/// sending them to all subscribed Discord channels. Errors are logged but do not
/// crash the task.
pub async fn run(mut rx: mpsc::UnboundedReceiver<Notification>, http: Arc<Http>, db: PgPool) {
    tracing::info!("Notification receiver task started");

    while let Some(notification) = rx.recv().await {
        let event_type = notification.event.as_str();
        tracing::debug!(event = event_type, "Received notification");

        // Query subscribed channels for this event type
        let subs: Vec<SubscriptionRow> = match sqlx::query_as(
            "SELECT channel_id FROM sentinel_notification_subscriptions WHERE event_type = $1",
        )
        .bind(event_type)
        .fetch_all(&db)
        .await
        {
            Ok(subs) => subs,
            Err(e) => {
                tracing::error!(
                    event = event_type,
                    error = %e,
                    "Failed to query notification subscriptions"
                );
                continue;
            }
        };

        if subs.is_empty() {
            tracing::debug!(event = event_type, "No subscriptions for event");
            continue;
        }

        tracing::info!(
            event = event_type,
            count = subs.len(),
            "Sending notification to subscribed channels"
        );

        // Build the embed once for all channels
        let embed = build_embed(&notification);
        let message = CreateMessage::new().embed(embed);

        // Send to each subscribed channel
        for sub in subs {
            let channel_id = match sub.channel_id.parse::<u64>() {
                Ok(id) => ChannelId::new(id),
                Err(e) => {
                    tracing::warn!(
                        channel_id = sub.channel_id,
                        error = %e,
                        "Invalid channel ID in subscription"
                    );
                    continue;
                }
            };

            if let Err(e) = channel_id.send_message(&http, message.clone()).await {
                tracing::error!(
                    channel_id = %channel_id,
                    event = event_type,
                    error = %e,
                    "Failed to send notification to channel"
                );
            }
        }
    }

    tracing::info!("Notification receiver task stopped");
}

/// Build a Discord embed from a notification.
fn build_embed(notification: &Notification) -> CreateEmbed {
    let mut embed = CreateEmbed::new()
        .title(&notification.title)
        .description(&notification.description)
        .color(notification.color);

    if let Some(url) = &notification.url {
        embed = embed.url(url);
    }

    for (name, value) in &notification.fields {
        embed = embed.field(name, value, true);
    }

    embed
}
