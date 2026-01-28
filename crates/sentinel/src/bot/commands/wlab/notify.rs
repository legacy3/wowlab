use std::time::Duration;

use poise::serenity_prelude::{self as serenity, ChannelType, ComponentInteractionCollector};

use crate::bot::{Context, Error};
use crate::notifications::NotificationEvent;
use crate::utils::{colors, markdown as md};

/// Manage notification subscriptions for this server
#[poise::command(
    slash_command,
    guild_only,
    subcommands("subscribe", "list", "unsubscribe"),
    default_member_permissions = "MANAGE_GUILD"
)]
pub async fn notify(_ctx: Context<'_>) -> Result<(), Error> {
    Ok(())
}

/// Subscribe a channel to receive notifications for an event type
#[poise::command(slash_command, guild_only, required_permissions = "MANAGE_GUILD")]
pub async fn subscribe(
    ctx: Context<'_>,
    #[description = "Event type to subscribe to"]
    #[autocomplete = "autocomplete_event_type"]
    event: String,
) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Must be used in a server")?;

    // Validate event type
    if event.parse::<NotificationEvent>().is_err() {
        let valid_types: Vec<_> = NotificationEvent::all()
            .iter()
            .map(|e| e.as_str())
            .collect();
        ctx.send(
            poise::CreateReply::default().ephemeral(true).embed(
                serenity::CreateEmbed::new()
                    .title("Invalid Event Type")
                    .description(format!("Valid event types: {}", valid_types.join(", ")))
                    .color(colors::YELLOW),
            ),
        )
        .await?;
        return Ok(());
    }

    // Create a unique ID for this interaction
    let custom_id = format!("notify_channel_select_{}", ctx.id());

    // Send message with channel selector
    let reply = ctx
        .send(
            poise::CreateReply::default()
                .embed(
                    serenity::CreateEmbed::new()
                        .title("Select Channel")
                        .description(format!(
                            "Choose a channel to receive {} notifications:",
                            md::bold(&event)
                        ))
                        .color(colors::BLURPLE),
                )
                .components(vec![serenity::CreateActionRow::SelectMenu(
                    serenity::CreateSelectMenu::new(
                        &custom_id,
                        serenity::CreateSelectMenuKind::Channel {
                            channel_types: Some(vec![ChannelType::Text, ChannelType::News]),
                            default_channels: None,
                        },
                    )
                    .placeholder("Select a channel")
                    .min_values(1)
                    .max_values(1),
                )]),
        )
        .await?;

    // Wait for the channel selection
    let _message = reply.message().await?;
    let interaction = ComponentInteractionCollector::new(ctx.serenity_context().shard.clone())
        .filter(move |i| i.data.custom_id == custom_id)
        .timeout(Duration::from_secs(60))
        .await;

    let Some(interaction) = interaction else {
        // Timeout - update message to show timeout
        reply
            .edit(
                ctx,
                poise::CreateReply::default()
                    .embed(
                        serenity::CreateEmbed::new()
                            .title("Selection Timed Out")
                            .description("No channel was selected within 60 seconds.")
                            .color(colors::YELLOW),
                    )
                    .components(vec![]),
            )
            .await?;
        return Ok(());
    };

    // Extract the selected channel
    let channel_id = match &interaction.data.kind {
        serenity::ComponentInteractionDataKind::ChannelSelect { values } => values.first().copied(),
        _ => None,
    };

    let Some(channel_id) = channel_id else {
        interaction
            .create_response(
                &ctx.serenity_context().http,
                serenity::CreateInteractionResponse::UpdateMessage(
                    serenity::CreateInteractionResponseMessage::new()
                        .embed(
                            serenity::CreateEmbed::new()
                                .title("Error")
                                .description("No channel was selected.")
                                .color(colors::YELLOW),
                        )
                        .components(vec![]),
                ),
            )
            .await?;
        return Ok(());
    };

    // Save to database (upsert)
    let db = &ctx.data().state.db;
    let created_by = ctx.author().id.to_string();

    let result = sqlx::query(
        r#"
        INSERT INTO sentinel_notification_subscriptions (guild_id, channel_id, event_type, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, event_type) DO UPDATE
        SET channel_id = EXCLUDED.channel_id,
            created_by = EXCLUDED.created_by,
            created_at = NOW()
        "#,
    )
    .bind(guild_id.to_string())
    .bind(channel_id.to_string())
    .bind(&event)
    .bind(&created_by)
    .execute(db)
    .await;

    match result {
        Ok(_) => {
            interaction
                .create_response(
                    &ctx.serenity_context().http,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(
                                serenity::CreateEmbed::new()
                                    .title("Subscription Created")
                                    .description(format!(
                                        "{} notifications will be sent to {}",
                                        md::bold(&event),
                                        md::channel(channel_id)
                                    ))
                                    .color(colors::GREEN),
                            )
                            .components(vec![]),
                    ),
                )
                .await?;
        }
        Err(e) => {
            tracing::error!("Failed to save subscription: {}", e);
            interaction
                .create_response(
                    &ctx.serenity_context().http,
                    serenity::CreateInteractionResponse::UpdateMessage(
                        serenity::CreateInteractionResponseMessage::new()
                            .embed(
                                serenity::CreateEmbed::new()
                                    .title("Error")
                                    .description("Failed to save subscription. Please try again.")
                                    .color(colors::YELLOW),
                            )
                            .components(vec![]),
                    ),
                )
                .await?;
        }
    }

    Ok(())
}

/// List all notification subscriptions for this server
#[poise::command(slash_command, guild_only)]
pub async fn list(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Must be used in a server")?;
    let db = &ctx.data().state.db;

    ctx.defer().await?;

    let rows = sqlx::query_as::<_, SubscriptionRow>(
        r#"
        SELECT event_type, channel_id
        FROM sentinel_notification_subscriptions
        WHERE guild_id = $1
        ORDER BY event_type
        "#,
    )
    .bind(guild_id.to_string())
    .fetch_all(db)
    .await?;

    if rows.is_empty() {
        ctx.send(
            poise::CreateReply::default().embed(
                serenity::CreateEmbed::new()
                    .title("No Subscriptions")
                    .description(
                        "This server has no notification subscriptions.\n\n\
                         Use `/wlab notify subscribe` to add one.",
                    )
                    .color(colors::YELLOW),
            ),
        )
        .await?;
        return Ok(());
    }

    let mut lines = Vec::new();
    for row in &rows {
        lines.push(format!(
            "{} → {}",
            md::code(&row.event_type),
            md::channel(&row.channel_id)
        ));
    }

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title("Notification Subscriptions")
                .description(lines.join("\n"))
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}

/// Unsubscribe from notifications for an event type
#[poise::command(slash_command, guild_only, required_permissions = "MANAGE_GUILD")]
pub async fn unsubscribe(
    ctx: Context<'_>,
    #[description = "Event type to unsubscribe from"]
    #[autocomplete = "autocomplete_event_type"]
    event: String,
) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Must be used in a server")?;
    let db = &ctx.data().state.db;

    ctx.defer_ephemeral().await?;

    let result = sqlx::query(
        r#"
        DELETE FROM sentinel_notification_subscriptions
        WHERE guild_id = $1 AND event_type = $2
        "#,
    )
    .bind(guild_id.to_string())
    .bind(&event)
    .execute(db)
    .await?;

    if result.rows_affected() > 0 {
        ctx.send(
            poise::CreateReply::default().embed(
                serenity::CreateEmbed::new()
                    .title("Unsubscribed")
                    .description(format!(
                        "Unsubscribed from {} notifications.",
                        md::bold(&event)
                    ))
                    .color(colors::GREEN),
            ),
        )
        .await?;
    } else {
        ctx.send(
            poise::CreateReply::default().embed(
                serenity::CreateEmbed::new()
                    .title("Not Found")
                    .description(format!(
                        "No subscription found for {} events.",
                        md::bold(&event)
                    ))
                    .color(colors::YELLOW),
            ),
        )
        .await?;
    }

    Ok(())
}

async fn autocomplete_event_type<'a>(_ctx: Context<'a>, partial: &'a str) -> Vec<String> {
    NotificationEvent::all()
        .iter()
        .map(|e| e.as_str())
        .filter(|e| e.contains(partial))
        .map(|e| e.to_string())
        .collect()
}

#[derive(Debug, sqlx::FromRow)]
struct SubscriptionRow {
    event_type: String,
    channel_id: String,
}
