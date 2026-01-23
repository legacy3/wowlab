use std::collections::HashMap;
use std::sync::Arc;

use poise::serenity_prelude::GuildId;
use tokio::sync::RwLock;
use uuid::Uuid;

use wowlab_sentinel::scheduler::assign::{is_eligible, JobInfo, NodePermission, OnlineNode};
use wowlab_sentinel::utils::bloom::BloomFilter;
use wowlab_sentinel::utils::filter_refresh::{FilterMap, GuildFilter};

const NODE_A: Uuid = Uuid::from_u128(1);
const NODE_B: Uuid = Uuid::from_u128(2);
const USER_A: Uuid = Uuid::from_u128(100);
const USER_B: Uuid = Uuid::from_u128(101);
const JOB_A: Uuid = Uuid::from_u128(200);

fn node(id: Uuid, user_id: Uuid, discord_id: Option<&str>) -> OnlineNode {
    OnlineNode {
        id,
        user_id,
        discord_id: discord_id.map(String::from),
        capacity: 4,
        backlog: 0,
    }
}

fn job(user_id: Uuid, access_type: Option<&str>, discord_server_id: Option<&str>) -> JobInfo {
    JobInfo {
        id: JOB_A,
        user_id,
        access_type: access_type.map(String::from),
        discord_server_id: discord_server_id.map(String::from),
    }
}

fn empty_filters() -> FilterMap {
    Arc::new(RwLock::new(HashMap::new()))
}

fn filters_with_member(guild_id: u64, discord_id: &str) -> FilterMap {
    let mut filter = BloomFilter::new(100, 0.001);
    filter.insert(discord_id);
    let mut map = HashMap::new();
    map.insert(
        GuildId::new(guild_id),
        GuildFilter { filter, member_count: 1 },
    );
    Arc::new(RwLock::new(map))
}

// --- Owner access ---

#[test]
fn owner_always_eligible() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_A, None, None);
    let filters = empty_filters();

    assert!(is_eligible(&n, &j, &[], &filters));
}

#[test]
fn owner_eligible_regardless_of_access_type() {
    let n = node(NODE_A, USER_A, None);
    let filters = empty_filters();

    for access in [None, Some("public"), Some("user"), Some("discord")] {
        let j = job(USER_A, access, None);
        assert!(
            is_eligible(&n, &j, &[], &filters),
            "owner should be eligible with access_type={access:?}"
        );
    }
}

// --- Public access ---

#[test]
fn public_allows_any_node() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("public"), None);
    let filters = empty_filters();

    assert!(is_eligible(&n, &j, &[], &filters));
}

// --- User access ---

#[test]
fn user_access_with_matching_permission() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("user"), None);
    let perms = vec![NodePermission {
        node_id: NODE_A,
        access_type: "user".to_string(),
        target_id: Some(USER_B.to_string()),
    }];
    let filters = empty_filters();

    assert!(is_eligible(&n, &j, &perms, &filters));
}

#[test]
fn user_access_without_permission_rejected() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("user"), None);
    let filters = empty_filters();

    assert!(!is_eligible(&n, &j, &[], &filters));
}

#[test]
fn user_access_wrong_target_rejected() {
    let other_user = Uuid::from_u128(999);
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("user"), None);
    let perms = vec![NodePermission {
        node_id: NODE_A,
        access_type: "user".to_string(),
        target_id: Some(other_user.to_string()),
    }];
    let filters = empty_filters();

    assert!(!is_eligible(&n, &j, &perms, &filters));
}

#[test]
fn user_access_wrong_node_rejected() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("user"), None);
    let perms = vec![NodePermission {
        node_id: NODE_B, // permission on different node
        access_type: "user".to_string(),
        target_id: Some(USER_B.to_string()),
    }];
    let filters = empty_filters();

    assert!(!is_eligible(&n, &j, &perms, &filters));
}

// --- Discord access ---

#[test]
fn discord_access_node_in_guild() {
    let guild_id = 123456789u64;
    let discord_id = "99887766";
    let filters = filters_with_member(guild_id, discord_id);

    let n = node(NODE_A, USER_A, Some(discord_id));
    let j = job(USER_B, Some("discord"), Some(&guild_id.to_string()));

    assert!(is_eligible(&n, &j, &[], &filters));
}

#[test]
fn discord_access_node_not_in_guild() {
    let guild_id = 123456789u64;
    let filters = filters_with_member(guild_id, "11111111");

    let n = node(NODE_A, USER_A, Some("99999999"));
    let j = job(USER_B, Some("discord"), Some(&guild_id.to_string()));

    assert!(!is_eligible(&n, &j, &[], &filters));
}

#[test]
fn discord_access_node_no_discord_id() {
    let guild_id = 123456789u64;
    let filters = filters_with_member(guild_id, "99887766");

    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("discord"), Some(&guild_id.to_string()));

    assert!(!is_eligible(&n, &j, &[], &filters));
}

#[test]
fn discord_access_job_no_server_id() {
    let filters = empty_filters();

    let n = node(NODE_A, USER_A, Some("99887766"));
    let j = job(USER_B, Some("discord"), None);

    assert!(!is_eligible(&n, &j, &[], &filters));
}

#[test]
fn discord_access_guild_not_in_filters() {
    let filters = empty_filters();

    let n = node(NODE_A, USER_A, Some("99887766"));
    let j = job(USER_B, Some("discord"), Some("123456789"));

    assert!(!is_eligible(&n, &j, &[], &filters));
}

// --- No access type (owner-only) ---

#[test]
fn no_access_type_non_owner_rejected() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, None, None);
    let filters = empty_filters();

    assert!(!is_eligible(&n, &j, &[], &filters));
}

#[test]
fn unknown_access_type_non_owner_rejected() {
    let n = node(NODE_A, USER_A, None);
    let j = job(USER_B, Some("something_else"), None);
    let filters = empty_filters();

    assert!(!is_eligible(&n, &j, &[], &filters));
}
