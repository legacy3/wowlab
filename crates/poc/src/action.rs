//! # Action
//!
//! Output type and extraction from optimized AST.

use rhai::{ASTNode, Expr, Stmt, AST};

/// Action to perform - the output of rotation evaluation.
#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    Cast(String),
    CastOn(String, String),
    Wait(f64),
    WaitGcd,
    Pool(String, f64),
    None,
}

/// Action encoding prefixes used by registered functions.
pub mod encoding {
    pub const CAST: &str = "CAST:";
    pub const WAIT: &str = "WAIT:";
    pub const WAIT_GCD: &str = "WAIT_GCD";
}

/// Extract the first action from an optimized AST.
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
