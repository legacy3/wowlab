//! Runtime context for JIT-compiled rotations.
//!
//! Dynamically builds a context schema based on what variables the rotation uses,
//! then populates it at runtime from SimState using the PopulateContext trait.

use std::collections::HashMap;

use crate::sim::SimState;
use wowlab_types::SimTime;

use super::ast::Expr;
use super::expr::{write_bool, write_f64, FieldType, PopulateContext};

/// Context schema - describes the layout of the runtime context buffer.
#[derive(Debug, Clone)]
pub struct ContextSchema {
    /// Total size in bytes.
    pub size: usize,
    /// Field definitions with offsets.
    pub fields: Vec<ContextField>,
    /// Map from expression to offset for quick lookup.
    offsets: HashMap<ExprKey, usize>,
    /// Map from user variable name to offset for quick lookup.
    user_var_offsets: HashMap<String, usize>,
}

/// Key for uniquely identifying an expression in the schema.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ExprKey {
    Resource(super::expr::ResourceExpr),
    Cooldown(super::expr::CooldownExpr),
    Buff(super::expr::BuffExpr),
    Debuff(super::expr::DebuffExpr),
    Dot(super::expr::DotExpr),
    Combat(super::expr::CombatExpr),
    Target(super::expr::TargetExpr),
    Enemy(super::expr::EnemyExpr),
    Player(super::expr::PlayerExpr),
    Spell(super::expr::SpellExpr),
    Talent(super::expr::TalentExpr),
    Gcd(super::expr::GcdExpr),
    Pet(super::expr::PetExpr),
    TrinketReady(u8),
    TrinketRemaining(u8),
    /// User-defined runtime variable.
    UserVar {
        name: String,
        var_type: FieldType,
    },
}

impl ExprKey {
    /// Create from an Expr.
    pub fn from_expr(expr: &Expr) -> Option<Self> {
        match expr {
            Expr::Resource(e) => Some(Self::Resource(e.clone())),
            Expr::Cooldown(e) => Some(Self::Cooldown(e.clone())),
            Expr::Buff(e) => Some(Self::Buff(e.clone())),
            Expr::Debuff(e) => Some(Self::Debuff(e.clone())),
            Expr::Dot(e) => Some(Self::Dot(e.clone())),
            Expr::Combat(e) => Some(Self::Combat(e.clone())),
            Expr::Target(e) => Some(Self::Target(e.clone())),
            Expr::Enemy(e) => Some(Self::Enemy(e.clone())),
            Expr::Player(e) => Some(Self::Player(e.clone())),
            Expr::Spell(e) => Some(Self::Spell(e.clone())),
            Expr::Talent(e) => Some(Self::Talent(e.clone())),
            Expr::Gcd(e) => Some(Self::Gcd(e.clone())),
            Expr::Pet(e) => Some(Self::Pet(e.clone())),
            Expr::TrinketReady { slot } => Some(Self::TrinketReady(*slot)),
            Expr::TrinketRemaining { slot } => Some(Self::TrinketRemaining(*slot)),
            _ => None,
        }
    }

    /// Get the field type for this key.
    pub fn field_type(&self) -> FieldType {
        match self {
            Self::Resource(e) => e.field_type(),
            Self::Cooldown(e) => e.field_type(),
            Self::Buff(e) => e.field_type(),
            Self::Debuff(e) => e.field_type(),
            Self::Dot(e) => e.field_type(),
            Self::Combat(e) => e.field_type(),
            Self::Target(e) => e.field_type(),
            Self::Enemy(e) => e.field_type(),
            Self::Player(e) => e.field_type(),
            Self::Spell(e) => e.field_type(),
            Self::Talent(e) => e.field_type(),
            Self::Gcd(e) => e.field_type(),
            Self::Pet(e) => e.field_type(),
            Self::TrinketReady(_) => FieldType::Bool,
            Self::TrinketRemaining(_) => FieldType::Float,
            Self::UserVar { var_type, .. } => *var_type,
        }
    }

    /// Populate the context buffer.
    ///
    /// Note: For UserVar, this is a no-op since user variables are initialized
    /// separately with their initial values and then modified at runtime.
    pub fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Resource(e) => e.populate(buffer, offset, state, now),
            Self::Cooldown(e) => e.populate(buffer, offset, state, now),
            Self::Buff(e) => e.populate(buffer, offset, state, now),
            Self::Debuff(e) => e.populate(buffer, offset, state, now),
            Self::Dot(e) => e.populate(buffer, offset, state, now),
            Self::Combat(e) => e.populate(buffer, offset, state, now),
            Self::Target(e) => e.populate(buffer, offset, state, now),
            Self::Enemy(e) => e.populate(buffer, offset, state, now),
            Self::Player(e) => e.populate(buffer, offset, state, now),
            Self::Spell(e) => e.populate(buffer, offset, state, now),
            Self::Talent(e) => e.populate(buffer, offset, state, now),
            Self::Gcd(e) => e.populate(buffer, offset, state, now),
            Self::Pet(e) => e.populate(buffer, offset, state, now),
            Self::TrinketReady(_) => write_bool(buffer, offset, false),
            Self::TrinketRemaining(_) => write_f64(buffer, offset, 0.0),
            // UserVar is initialized separately - skip here
            Self::UserVar { .. } => {}
        }
    }
}

/// A single field in the context.
#[derive(Debug, Clone)]
pub struct ContextField {
    pub key: ExprKey,
    pub offset: usize,
    pub field_type: FieldType,
}

impl ContextSchema {
    /// Create a new schema builder.
    pub fn builder() -> SchemaBuilder {
        SchemaBuilder::new()
    }

    /// Get the offset for an expression.
    pub fn offset(&self, key: &ExprKey) -> Option<usize> {
        self.offsets.get(key).copied()
    }

    /// Get the offset for an Expr.
    pub fn offset_for_expr(&self, expr: &Expr) -> Option<usize> {
        ExprKey::from_expr(expr).and_then(|key| self.offset(&key))
    }

    /// Get field type for an expression.
    pub fn field_type(&self, key: &ExprKey) -> Option<FieldType> {
        self.offsets.get(key).and_then(|offset| {
            self.fields
                .iter()
                .find(|f| f.offset == *offset)
                .map(|f| f.field_type)
        })
    }

    /// Get the offset for a user variable by name.
    pub fn user_var_offset(&self, name: &str) -> Option<usize> {
        self.user_var_offsets.get(name).copied()
    }

    /// Get the field type for a user variable by name.
    pub fn user_var_type(&self, name: &str) -> Option<FieldType> {
        self.user_var_offsets.get(name).and_then(|offset| {
            self.fields
                .iter()
                .find(|f| f.offset == *offset)
                .map(|f| f.field_type)
        })
    }
}

/// Builder for context schema.
pub struct SchemaBuilder {
    fields: Vec<ContextField>,
    seen: HashMap<ExprKey, usize>,
    current_offset: usize,
    /// Track user variable names to their offsets for quick lookup.
    user_var_offsets: HashMap<String, usize>,
}

impl SchemaBuilder {
    pub fn new() -> Self {
        Self {
            fields: Vec::new(),
            seen: HashMap::new(),
            current_offset: 0,
            user_var_offsets: HashMap::new(),
        }
    }

    /// Add an expression to the schema (deduplicates).
    pub fn add(&mut self, expr: &Expr) -> Option<usize> {
        let key = ExprKey::from_expr(expr)?;
        self.add_key(key)
    }

    /// Add a key to the schema (deduplicates).
    pub fn add_key(&mut self, key: ExprKey) -> Option<usize> {
        if let Some(&offset) = self.seen.get(&key) {
            return Some(offset);
        }

        let field_type = key.field_type();

        // Align offset
        let alignment = field_type.alignment();
        if !self.current_offset.is_multiple_of(alignment) {
            self.current_offset += alignment - (self.current_offset % alignment);
        }

        let offset = self.current_offset;
        self.current_offset += field_type.size();

        // Track user variable names separately for quick lookup
        if let ExprKey::UserVar { name, .. } = &key {
            self.user_var_offsets.insert(name.clone(), offset);
        }

        self.fields.push(ContextField {
            key: key.clone(),
            offset,
            field_type,
        });
        self.seen.insert(key, offset);

        Some(offset)
    }

    /// Add a user-defined variable to the schema.
    ///
    /// Returns the offset of the variable in the context buffer.
    pub fn add_user_var(&mut self, name: &str, var_type: FieldType) -> usize {
        let key = ExprKey::UserVar {
            name: name.to_string(),
            var_type,
        };
        self.add_key(key)
            .expect("user var should always be addable")
    }

    /// Get the offset for a user variable by name.
    pub fn user_var_offset(&self, name: &str) -> Option<usize> {
        self.user_var_offsets.get(name).copied()
    }

    /// Build the final schema.
    pub fn build(self) -> ContextSchema {
        // Align total size to 8 bytes
        let size = if !self.current_offset.is_multiple_of(8) {
            self.current_offset + (8 - self.current_offset % 8)
        } else {
            self.current_offset.max(8)
        };

        ContextSchema {
            size,
            fields: self.fields,
            offsets: self.seen,
            user_var_offsets: self.user_var_offsets,
        }
    }
}

impl Default for SchemaBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Populate a context buffer from SimState.
///
/// This function is now very simple - it just iterates over the fields
/// and delegates to each field's populate method via the PopulateContext trait.
pub fn populate_context(buffer: &mut [u8], schema: &ContextSchema, state: &SimState) {
    let now = state.now();

    for field in &schema.fields {
        field.key.populate(buffer, field.offset, state, now);
    }
}
