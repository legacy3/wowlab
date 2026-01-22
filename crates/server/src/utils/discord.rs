use poise::serenity_prelude::{GuildId, Http, UserId};

const MEMBER_PAGE_SIZE: u64 = 1000;

/// Fetch all human (non-bot) member Discord IDs from a guild, paginating.
pub async fn fetch_all_member_ids(
    http: &Http,
    guild_id: GuildId,
) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
    let mut all_ids = Vec::new();
    let mut after: Option<UserId> = None;

    loop {
        let members = guild_id.members(http, Some(MEMBER_PAGE_SIZE), after).await?;

        if members.is_empty() {
            break;
        }

        let last_id = members.last().map(|m| m.user.id);

        for member in &members {
            if !member.user.bot {
                all_ids.push(member.user.id.to_string());
            }
        }

        if members.len() < MEMBER_PAGE_SIZE as usize {
            break;
        }

        after = last_id;
    }

    Ok(all_ids)
}
