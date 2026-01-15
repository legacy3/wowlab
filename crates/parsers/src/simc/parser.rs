//! Parser for SimC profile strings
//!
//! Transforms a token stream into a structured Profile.

use std::collections::HashMap;

use super::errors::ParseError;
use super::lexer::{lex, Token};
use super::types::{Character, Item, Loadout, Profession, Profile, Slot, Talents, WowClass};

// ============================================================================
// Public API
// ============================================================================

/// Parse a SimC profile string into structured data
pub fn parse(input: &str) -> Result<Profile, ParseError> {
    Parser::new(input).parse()
}

// ============================================================================
// Parser
// ============================================================================

struct Parser<'a> {
    tokens: Vec<Token<'a>>,
    pos: usize,

    // Parsed data
    class: Option<WowClass>,
    name: Option<String>,
    assignments: HashMap<String, String>,
    equipment: Vec<Item>,
    loadouts: Vec<Loadout>,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        let tokens: Vec<_> = lex(input).filter_map(|r| r.ok()).collect();
        let loadouts = extract_loadouts(&tokens);

        Self {
            tokens,
            pos: 0,
            class: None,
            name: None,
            assignments: HashMap::new(),
            equipment: Vec::new(),
            loadouts,
        }
    }

    fn peek(&self) -> Option<&Token<'a>> {
        self.tokens.get(self.pos)
    }

    fn advance(&mut self) -> Option<&Token<'a>> {
        let t = self.tokens.get(self.pos);
        if t.is_some() {
            self.pos += 1;
        }
        t
    }

    fn skip_newlines(&mut self) {
        while matches!(self.peek(), Some(Token::Newline)) {
            self.advance();
        }
    }

    fn parse(mut self) -> Result<Profile, ParseError> {
        self.skip_newlines();

        while self.pos < self.tokens.len() {
            self.parse_line()?;
            self.skip_newlines();
        }

        self.build_profile()
    }

    fn parse_line(&mut self) -> Result<(), ParseError> {
        match self.peek() {
            Some(Token::Comment(_)) | Some(Token::Newline) => {
                self.advance();
                Ok(())
            }
            Some(Token::Ident(_)) => self.parse_assignment(),
            _ => {
                self.advance();
                Ok(())
            }
        }
    }

    fn parse_assignment(&mut self) -> Result<(), ParseError> {
        let key = match self.advance() {
            Some(Token::Ident(k)) => *k,
            _ => return Ok(()),
        };

        if !matches!(self.peek(), Some(Token::Eq)) {
            return Ok(());
        }
        self.advance();

        // Class definition: warrior="Name"
        if let Some(class) = WowClass::parse(key) {
            self.class = Some(class);
            self.name = Some(self.parse_string_value());
            return Ok(());
        }

        // Equipment: head=,id=123,...
        if matches!(self.peek(), Some(Token::Comma)) {
            return self.parse_equipment(key);
        }

        // Regular assignment
        let value = self.parse_value();
        self.assignments.insert(key.to_string(), value);
        Ok(())
    }

    fn parse_string_value(&mut self) -> String {
        match self.advance() {
            Some(Token::String(s) | Token::SingleString(s)) => s.to_string(),
            Some(Token::Ident(s)) => s.to_string(),
            Some(Token::Number(n)) => n.to_string(),
            _ => String::new(),
        }
    }

    fn parse_value(&mut self) -> String {
        let mut parts = Vec::new();

        loop {
            match self.peek() {
                Some(Token::Newline) | None => break,
                Some(Token::String(s) | Token::SingleString(s)) => {
                    parts.push(s.to_string());
                    self.advance();
                }
                Some(Token::Ident(s)) => {
                    parts.push(s.to_string());
                    self.advance();
                }
                Some(Token::Number(n)) => {
                    parts.push(n.to_string());
                    self.advance();
                }
                Some(Token::Slash) => {
                    parts.push("/".to_string());
                    self.advance();
                }
                Some(Token::Plus) => {
                    parts.push("+".to_string());
                    self.advance();
                }
                Some(Token::Eq) => {
                    parts.push("=".to_string());
                    self.advance();
                }
                Some(Token::Colon) => {
                    parts.push(":".to_string());
                    self.advance();
                }
                _ => break,
            }
        }

        parts.join("")
    }

    fn parse_equipment(&mut self, slot_name: &str) -> Result<(), ParseError> {
        let slot = match Slot::parse(slot_name) {
            Some(s) => s,
            None => return Ok(()),
        };

        // Skip leading comma
        if matches!(self.peek(), Some(Token::Comma)) {
            self.advance();
        }

        let kv = self.parse_kv_pairs();

        let id = kv.get("id").and_then(|s| s.parse().ok()).unwrap_or(0);
        if id == 0 {
            return Ok(());
        }

        self.equipment.push(Item {
            slot,
            id,
            bonus_ids: parse_id_list(kv.get("bonus_id")),
            enchant_id: kv.get("enchant_id").and_then(|s| s.parse().ok()),
            gem_ids: parse_id_list(kv.get("gem_id")),
            crafted_stats: parse_id_list(kv.get("crafted_stats")),
            crafting_quality: kv.get("crafting_quality").and_then(|s| s.parse().ok()),
        });

        Ok(())
    }

    fn parse_kv_pairs(&mut self) -> HashMap<String, String> {
        let mut result = HashMap::new();

        while let Some(Token::Ident(k)) = self.peek() {
            let key = k.to_string();
            self.advance();

            if !matches!(self.peek(), Some(Token::Eq)) {
                break;
            }
            self.advance();

            let value = self.parse_kv_value();
            result.insert(key, value);

            if matches!(self.peek(), Some(Token::Comma)) {
                self.advance();
            } else {
                break;
            }
        }

        result
    }

    fn parse_kv_value(&mut self) -> String {
        let mut parts = Vec::new();

        loop {
            match self.peek() {
                Some(Token::Number(n)) => {
                    parts.push(n.to_string());
                    self.advance();
                }
                Some(Token::Slash) => {
                    parts.push("/".to_string());
                    self.advance();
                }
                Some(Token::Ident(s)) => {
                    parts.push(s.to_string());
                    self.advance();
                }
                _ => break,
            }
        }

        parts.join("")
    }

    fn build_profile(&self) -> Result<Profile, ParseError> {
        let class = self.class.ok_or(ParseError::MissingClass)?;
        let name = self.name.clone().ok_or(ParseError::MissingName)?;

        let character = Character {
            name,
            level: self.get_u32("level").unwrap_or(80),
            race: self
                .get_title_case("race")
                .unwrap_or_else(|| "Unknown".to_string()),
            class,
            spec: self.get_title_case("spec"),
            region: self.assignments.get("region").map(|s| s.to_uppercase()),
            server: self.assignments.get("server").cloned(),
            role: self.assignments.get("role").cloned(),
            professions: self.parse_professions(),
        };

        let talents = Talents {
            encoded: self.assignments.get("talents").cloned().unwrap_or_default(),
            loadouts: self.loadouts.clone(),
        };

        let mut extra = self.assignments.clone();
        for key in [
            "level",
            "race",
            "spec",
            "region",
            "server",
            "role",
            "talents",
            "professions",
        ] {
            extra.remove(key);
        }

        Ok(Profile {
            character,
            equipment: self.equipment.clone(),
            talents,
            extra,
        })
    }

    fn get_u32(&self, key: &str) -> Option<u32> {
        self.assignments.get(key).and_then(|s| s.parse().ok())
    }

    fn get_title_case(&self, key: &str) -> Option<String> {
        self.assignments.get(key).map(|s| title_case(s))
    }

    fn parse_professions(&self) -> Vec<Profession> {
        let Some(s) = self.assignments.get("professions") else {
            return Vec::new();
        };

        s.split('/')
            .filter_map(|part| {
                let (name, rank) = part.split_once('=')?;
                Some(Profession {
                    name: title_case(name),
                    rank: rank.parse().ok()?,
                })
            })
            .collect()
    }
}

// ============================================================================
// Helpers
// ============================================================================

fn extract_loadouts(tokens: &[Token<'_>]) -> Vec<Loadout> {
    let mut loadouts = Vec::new();
    let mut pending_name: Option<String> = None;

    for token in tokens {
        if let Token::Comment(c) = token {
            let text = c.strip_prefix('#').unwrap_or(c).trim();

            if let Some(name) = text
                .strip_prefix("Saved Loadout:")
                .or_else(|| text.strip_prefix("Saved loadout:"))
            {
                pending_name = Some(name.trim().to_string());
            } else if let Some(rest) = text.strip_prefix("talents=") {
                if let Some(name) = pending_name.take() {
                    loadouts.push(Loadout {
                        name,
                        encoded: rest.trim().to_string(),
                    });
                }
            }
        }
    }

    loadouts
}

fn parse_id_list(value: Option<&String>) -> Option<Vec<u32>> {
    let s = value?;
    let nums: Vec<u32> = s.split('/').filter_map(|p| p.parse().ok()).collect();
    if nums.is_empty() {
        None
    } else {
        Some(nums)
    }
}

fn title_case(s: &str) -> String {
    s.split('_')
        .map(|w| {
            let mut c = w.chars();
            match c.next() {
                Some(first) => first.to_uppercase().chain(c).collect(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

