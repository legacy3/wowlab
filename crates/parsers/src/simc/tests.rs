//! Unit tests for SimC lexer and parser

use super::lexer::{lex, Token};
use super::parser::parse;
use super::types::WowClass;

// ============================================================================
// Lexer Tests
// ============================================================================

#[test]
fn test_basic_tokens() {
    let mut lexer = lex("warrior=\"TestName\"");
    assert!(matches!(lexer.next(), Some(Ok(Token::Ident("warrior")))));
    assert!(matches!(lexer.next(), Some(Ok(Token::Eq))));
    assert!(matches!(lexer.next(), Some(Ok(Token::String("TestName")))));
}

#[test]
fn test_number() {
    let mut lexer = lex("123");
    assert!(matches!(lexer.next(), Some(Ok(Token::Number(123)))));
}

#[test]
fn test_comment() {
    let mut lexer = lex("# This is a comment\n");
    assert!(matches!(lexer.next(), Some(Ok(Token::Comment(_)))));
    assert!(matches!(lexer.next(), Some(Ok(Token::Newline))));
}

#[test]
fn test_slash() {
    let mut lexer = lex("123/456");
    assert!(matches!(lexer.next(), Some(Ok(Token::Number(123)))));
    assert!(matches!(lexer.next(), Some(Ok(Token::Slash))));
    assert!(matches!(lexer.next(), Some(Ok(Token::Number(456)))));
}

// ============================================================================
// Parser Tests
// ============================================================================

#[test]
fn test_basic_profile() {
    let input = r#"warrior="TestChar"
level=80
race=human
spec=arms
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.character.name, "TestChar");
    assert_eq!(profile.character.class, WowClass::Warrior);
    assert_eq!(profile.character.level, 80);
}

#[test]
fn test_equipment() {
    let input = r#"warrior="TestChar"
head=,id=12345,bonus_id=123/456
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.equipment.len(), 1);
    assert_eq!(profile.equipment[0].id, 12345);
    assert_eq!(profile.equipment[0].bonus_ids, Some(vec![123, 456]));
}
