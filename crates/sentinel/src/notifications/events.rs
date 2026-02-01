use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum NotificationEvent {
    GitPush,
    GitPr,
    Deployment,
    NodeOnline,
    NodeOffline,
}

impl NotificationEvent {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::GitPush => "git-push",
            Self::GitPr => "git-pr",
            Self::Deployment => "deployment",
            Self::NodeOnline => "node-online",
            Self::NodeOffline => "node-offline",
        }
    }

    pub fn color(&self) -> u32 {
        match self {
            Self::GitPush => COLOR_GIT_PUSH,
            Self::GitPr => COLOR_GIT_PR,
            Self::Deployment => COLOR_DEPLOYMENT,
            Self::NodeOnline => COLOR_NODE_ONLINE,
            Self::NodeOffline => COLOR_NODE_OFFLINE,
        }
    }

    pub fn all() -> &'static [Self] {
        &[
            Self::GitPush,
            Self::GitPr,
            Self::Deployment,
            Self::NodeOnline,
            Self::NodeOffline,
        ]
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseNotificationEventError;

impl fmt::Display for ParseNotificationEventError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid notification event type")
    }
}

impl std::error::Error for ParseNotificationEventError {}

impl FromStr for NotificationEvent {
    type Err = ParseNotificationEventError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "git-push" => Ok(Self::GitPush),
            "git-pr" => Ok(Self::GitPr),
            "deployment" => Ok(Self::Deployment),
            "node-online" => Ok(Self::NodeOnline),
            "node-offline" => Ok(Self::NodeOffline),
            _ => Err(ParseNotificationEventError),
        }
    }
}

impl fmt::Display for NotificationEvent {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::GitPush => write!(f, "Git Push"),
            Self::GitPr => write!(f, "Git PR"),
            Self::Deployment => write!(f, "Deployment"),
            Self::NodeOnline => write!(f, "Node Online"),
            Self::NodeOffline => write!(f, "Node Offline"),
        }
    }
}

pub const COLOR_GIT_PUSH: u32 = 0x238636;
pub const COLOR_GIT_PR: u32 = 0x8957E5;
pub const COLOR_DEPLOYMENT: u32 = 0x0070F3;
pub const COLOR_NODE_ONLINE: u32 = 0x57F287;
pub const COLOR_NODE_OFFLINE: u32 = 0xED4245;

pub const COLOR_PR_OPENED: u32 = 0x238636;
pub const COLOR_PR_MERGED: u32 = 0x8957E5;
pub const COLOR_PR_CLOSED: u32 = 0xDA3633;
pub const COLOR_PR_REOPENED: u32 = 0x58A6FF;

pub const COLOR_DEPLOY_SUCCESS: u32 = 0x238636;
pub const COLOR_DEPLOY_FAILED: u32 = 0xDA3633;
pub const COLOR_DEPLOY_BUILDING: u32 = 0x58A6FF;
