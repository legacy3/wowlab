//! Action types and extraction from optimized AST.
//!
//! Actions are the output of rotation evaluation. After the AST is optimized,
//! it should be reduced to a single action string that can be extracted.

use rhai::{ASTNode, Expr, Stmt, AST};

/// Action to perform - the output of rotation evaluation.
#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    /// Cast a spell by name.
    Cast(String),
    /// Cast a spell on a specific target.
    CastOn(String, String),
    /// Wait for a specified duration in seconds.
    Wait(f64),
    /// Wait for the global cooldown to finish.
    WaitGcd,
    /// Pool resources for a spell (spell name, time to pool).
    Pool(String, f64),
    /// No action to take.
    None,
}

/// Action encoding prefixes used by registered functions.
///
/// These prefixes are used to encode actions as strings in the Rhai AST,
/// allowing them to be extracted after optimization.
pub mod encoding {
    /// Prefix for cast actions (e.g., `CAST:fireball`).
    pub const CAST: &str = "CAST:";
    /// Prefix for wait actions (e.g., `WAIT:1.5`).
    pub const WAIT: &str = "WAIT:";
    /// String constant for wait-GCD actions.
    pub const WAIT_GCD: &str = "WAIT_GCD";
}

/// Extracts the first action from an optimized AST.
///
/// Walks the AST looking for action-encoded string constants and returns
/// the first one found, or [`Action::None`] if none is present.
#[must_use]
pub fn extract(ast: &AST) -> Action {
    let mut action = Action::None;

    ast.walk(&mut |nodes: &[ASTNode]| {
        if let Some(a) = nodes.last().and_then(try_extract_action) {
            action = a;
            return false; // stop walking
        }
        true
    });

    action
}

/// Attempts to extract an action from an AST node.
fn try_extract_action(node: &ASTNode) -> Option<Action> {
    let expr = match node {
        ASTNode::Stmt(Stmt::Expr(e)) => e.as_ref(),
        ASTNode::Expr(e) => e,
        _ => return None,
    };

    if let Expr::StringConstant(s, _) = expr {
        return parse_action_string(s.as_str());
    }
    None
}

/// Parses an action from its string encoding.
fn parse_action_string(s: &str) -> Option<Action> {
    if let Some(spell) = s.strip_prefix(encoding::CAST) {
        Some(Action::Cast(spell.to_string()))
    } else if let Some(secs) = s.strip_prefix(encoding::WAIT) {
        secs.parse().ok().map(Action::Wait)
    } else if s == encoding::WAIT_GCD {
        Some(Action::WaitGcd)
    } else {
        None
    }
}
