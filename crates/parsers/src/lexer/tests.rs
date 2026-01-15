use super::*;

#[test]
fn test_class_definition() {
    let mut lexer = lex(r#"warrior="Test""#);
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("warrior"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::String("Test"))));
}

#[test]
fn test_assignment() {
    let mut lexer = lex("level=80");
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("level"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::Number(80))));
}

#[test]
fn test_equipment_line() {
    let mut lexer = lex("head=,id=123,bonus_id=1/2/3");
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("head"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::Comma)));
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("id"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::Number(123))));
    assert_eq!(lexer.next(), Some(Ok(Token::Comma)));
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("bonus_id"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::Number(1))));
    assert_eq!(lexer.next(), Some(Ok(Token::Slash)));
    assert_eq!(lexer.next(), Some(Ok(Token::Number(2))));
    assert_eq!(lexer.next(), Some(Ok(Token::Slash)));
    assert_eq!(lexer.next(), Some(Ok(Token::Number(3))));
}

#[test]
fn test_comment() {
    let mut lexer = lex("# This is a comment");
    let token = lexer.next();
    assert!(matches!(token, Some(Ok(Token::Comment(_)))));
}

#[test]
fn test_single_quoted_string() {
    let mut lexer = lex("warrior='TestChar'");
    assert_eq!(lexer.next(), Some(Ok(Token::Ident("warrior"))));
    assert_eq!(lexer.next(), Some(Ok(Token::Eq)));
    assert_eq!(lexer.next(), Some(Ok(Token::SingleString("TestChar"))));
}
