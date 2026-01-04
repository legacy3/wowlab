# Issue 12: String Errors in CLI

## Category

Error Handling

## Severity

Medium

## Location

`src/cli/mod.rs:362`

## Description

The `to_sim_config()` method returns `Result<SimConfig, String>` instead of a typed error. This loses error categorization and makes handling specific failures difficult.

## Current Code

```rust
// cli/mod.rs:362
impl SpecConfigToml {
    pub fn to_sim_config(&self) -> Result<SimConfig, String> {
        // Various error cases all return String
        let spec_id = match parse_spec_id(&self.spec.id) {
            Some(id) => id,
            None => return Err(format!("Unknown spec: {}", self.spec.id)),
        };

        let paperdoll = Paperdoll::from_config(
            spec_id,
            self.player.level,
            &self.player,
        ).map_err(|e| format!("Failed to create paperdoll: {}", e))?;

        // ... more string errors
    }
}
```

## Problems

1. **No error categorization** - Can't distinguish parse error from validation error
2. **No structured data** - Can't extract which field failed
3. **Hard to localize** - Error messages baked into code
4. **Poor composability** - Can't use `?` with other error types easily

## Proposed Fix

### 1. Define Typed Error

```rust
// cli/error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("unknown spec identifier: {spec_id}")]
    UnknownSpec { spec_id: String },

    #[error("unknown class: {class_name}")]
    UnknownClass { class_name: String },

    #[error("invalid player config: {reason}")]
    InvalidPlayer { reason: String },

    #[error("invalid weapon config: {reason}")]
    InvalidWeapon { reason: String },

    #[error("invalid spell definition for '{spell_name}': {reason}")]
    InvalidSpell { spell_name: String, reason: String },

    #[error("invalid aura definition for '{aura_name}': {reason}")]
    InvalidAura { aura_name: String, reason: String },

    #[error("invalid pet config: {reason}")]
    InvalidPet { reason: String },

    #[error("spell '{spell_name}' references unknown aura ID {aura_id}")]
    AuraNotFound { spell_name: String, aura_id: u32 },

    #[error("duplicate spell ID {spell_id} in {first_name} and {second_name}")]
    DuplicateSpellId {
        spell_id: u32,
        first_name: String,
        second_name: String
    },

    #[error("paperdoll creation failed: {0}")]
    PaperdollError(#[from] PaperdollError),

    #[error("rotation compilation failed: {0}")]
    RotationError(#[from] RotationError),
}

/// Additional context for error display
impl ConfigError {
    /// Get the field path that caused the error
    pub fn field_path(&self) -> Option<&str> {
        match self {
            ConfigError::InvalidPlayer { .. } => Some("player"),
            ConfigError::InvalidWeapon { .. } => Some("player.weapon"),
            ConfigError::InvalidSpell { .. } => Some("spells[]"),
            ConfigError::InvalidAura { .. } => Some("auras[]"),
            ConfigError::InvalidPet { .. } => Some("pet"),
            _ => None,
        }
    }

    /// Get suggestion for fixing the error
    pub fn suggestion(&self) -> Option<String> {
        match self {
            ConfigError::UnknownSpec { spec_id } => {
                Some(format!(
                    "Valid specs: hunter:beast-mastery, hunter:marksmanship, hunter:survival, ..."
                ))
            }
            ConfigError::AuraNotFound { aura_id, .. } => {
                Some(format!(
                    "Add an [[auras]] section with id = {aura_id}"
                ))
            }
            _ => None,
        }
    }
}
```

### 2. Update to_sim_config

```rust
impl SpecConfigToml {
    pub fn to_sim_config(&self) -> Result<SimConfig, ConfigError> {
        let spec_id = parse_spec_id(&self.spec.id)
            .ok_or_else(|| ConfigError::UnknownSpec {
                spec_id: self.spec.id.clone()
            })?;

        let paperdoll = Paperdoll::from_config(
            spec_id,
            self.player.level,
            &self.player,
        )?;  // Uses #[from] conversion

        // Validate spell → aura references
        for spell in &self.spells {
            for effect in &spell.effects {
                if let SpellEffectToml::ApplyAura { aura_id, .. } = effect {
                    if !self.auras.iter().any(|a| a.id == *aura_id) {
                        return Err(ConfigError::AuraNotFound {
                            spell_name: spell.name.clone(),
                            aura_id: *aura_id,
                        });
                    }
                }
            }
        }

        // ... rest of conversion

        Ok(config)
    }
}
```

### 3. Update CLI Usage

```rust
// main.rs
fn load_spec_config(path: &Path) -> Result<SimConfig, EngineError> {
    let toml_str = fs::read_to_string(path)
        .map_err(|e| EngineError::IoError(e))?;

    let spec_toml: SpecConfigToml = toml::from_str(&toml_str)
        .map_err(|e| EngineError::TomlError(e))?;

    let config = spec_toml.to_sim_config()
        .map_err(|e| {
            // Rich error display
            eprintln!("Configuration error: {}", e);
            if let Some(path) = e.field_path() {
                eprintln!("  in field: {}", path);
            }
            if let Some(suggestion) = e.suggestion() {
                eprintln!("  suggestion: {}", suggestion);
            }
            EngineError::ConfigError(e)
        })?;

    Ok(config)
}
```

### 4. Update EngineError

```rust
// lib.rs
#[derive(Debug, Error)]
pub enum EngineError {
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("TOML parse error: {0}")]
    TomlError(#[from] toml::de::Error),

    #[error("configuration error: {0}")]
    ConfigError(#[from] ConfigError),  // NEW

    #[error("rotation error: {0}")]
    RotationError(#[from] RotationError),

    #[error("simulation error: {0}")]
    SimulationError(String),
}
```

## Example Output

Before:

```
Error: Failed to create paperdoll: unknown spec
```

After:

```
Configuration error: unknown spec identifier: hunter:beastmastery
  in field: spec.id
  suggestion: Valid specs: hunter:beast-mastery, hunter:marksmanship, hunter:survival, ...
```

## Impact

- Better error messages for users
- Easier debugging
- Programmatic error handling possible
- Foundation for error recovery/suggestions

## Effort

Medium (4-6 hours)

## Tests Required

- Test each ConfigError variant
- Test error suggestions
- Test error propagation through EngineError
