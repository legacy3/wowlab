use std::sync::Arc;

use poise::serenity_prelude::{
    AutoArchiveDuration, ChannelId, CreateEmbed, CreateMessage, CreateThread, Http,
};
use sqlx::{FromRow, PgPool};
use tokio::sync::mpsc;

use super::Notification;

#[derive(FromRow)]
struct SubscriptionRow {
    channel_id: String,
}

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

            let sent_message = match channel_id.send_message(&http, message.clone()).await {
                Ok(msg) => msg,
                Err(e) => {
                    tracing::error!(
                        channel_id = %channel_id,
                        event = event_type,
                        error = %e,
                        "Failed to send notification to channel"
                    );
                    continue;
                }
            };

            // Post thread reply if thread_content is set
            if let Some(ref thread_content) = notification.thread_content {
                let thread_name = notification.thread_name.as_deref().unwrap_or("AI Summary");

                let thread = match sent_message
                    .channel_id
                    .create_thread_from_message(
                        &http,
                        sent_message.id,
                        CreateThread::new(thread_name)
                            .auto_archive_duration(AutoArchiveDuration::OneHour),
                    )
                    .await
                {
                    Ok(thread) => thread,
                    Err(e) => {
                        tracing::warn!(
                            error = %e,
                            "Failed to create thread for AI summary"
                        );
                        continue;
                    }
                };

                if let Err(e) = thread
                    .id
                    .send_message(&http, CreateMessage::new().content(thread_content))
                    .await
                {
                    tracing::warn!(
                        error = %e,
                        "Failed to send AI summary to thread"
                    );
                }
            }
        }
    }

    tracing::info!("Notification receiver task stopped");
}

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
