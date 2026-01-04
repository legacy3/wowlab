# Issue 16: String Matching Instead of Enums

## Category

Type Safety

## Severity

Medium

## Location

`src/cli/mod.rs:428-431`

## Description

Class identification uses string matching with multiple lowercase variants instead of parsing to an enum. This is error-prone and inefficient.

## Current Code

```rust
// cli/mod.rs:428-431
// TODO Hacked-Junk
let is_dk = self.spec.class.to_lowercase() == "deathknight"
    || self.spec.class.to_lowercase() == "death_knight"
    || self.spec.class.to_lowercase() == "death knight";

// Also found in other locations:
let class_name = self.spec.class.to_lowercase();
match class_name.as_str() {
    "hunter" => { ... }
    "warrior" => { ... }
    _ => { ... }
}
```

## Problems

1. **Multiple allocations** - `to_lowercase()` allocates each call
2. **Inconsistent naming** - "deathknight" vs "death_knight" vs "death knight"
3. **Easy to typo** - No compile-time checking of strings
4. **TODO comment** - Acknowledged tech debt
5. **No suggestions** - Typo "huntr" just fails silently

## Proposed Fix

### 1. Use ClassId Enum (Already Exists!)

```rust
// paperdoll/types.rs already has:
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ClassId {
    Warrior = 1,
    Paladin = 2,
    Hunter = 3,
    Rogue = 4,
    Priest = 5,
    DeathKnight = 6,
    Shaman = 7,
    Mage = 8,
    Warlock = 9,
    Monk = 10,
    Druid = 11,
    DemonHunter = 12,
    Evoker = 13,
}
```

### 2. Add FromStr Implementation

```rust
impl std::str::FromStr for ClassId {
    type Err = ParseClassError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Normalize: lowercase, remove spaces/underscores
        let normalized: String = s.to_lowercase()
            .chars()
            .filter(|c| c.is_alphabetic())
            .collect();

        match normalized.as_str() {
            "warrior" => Ok(ClassId::Warrior),
            "paladin" => Ok(ClassId::Paladin),
            "hunter" => Ok(ClassId::Hunter),
            "rogue" => Ok(ClassId::Rogue),
            "priest" => Ok(ClassId::Priest),
            "deathknight" | "dk" => Ok(ClassId::DeathKnight),
            "shaman" | "shammy" => Ok(ClassId::Shaman),
            "mage" => Ok(ClassId::Mage),
            "warlock" | "lock" => Ok(ClassId::Warlock),
            "monk" => Ok(ClassId::Monk),
            "druid" => Ok(ClassId::Druid),
            "demonhunter" | "dh" => Ok(ClassId::DemonHunter),
            "evoker" => Ok(ClassId::Evoker),
            _ => Err(ParseClassError::Unknown(s.to_string())),
        }
    }
}

#[derive(Debug, Error)]
pub enum ParseClassError {
    #[error("unknown class '{0}'")]
    Unknown(String),
}

impl ParseClassError {
    /// Suggest similar class names
    pub fn suggestions(&self) -> Vec<&'static str> {
        match self {
            ParseClassError::Unknown(input) => {
                let normalized: String = input.to_lowercase()
                    .chars()
                    .filter(|c| c.is_alphabetic())
                    .collect();

                // Simple Levenshtein distance check
                let all_classes = [
                    "warrior", "paladin", "hunter", "rogue", "priest",
                    "deathknight", "shaman", "mage", "warlock", "monk",
                    "druid", "demonhunter", "evoker"
                ];

                all_classes.iter()
                    .filter(|c| levenshtein(&normalized, c) <= 2)
                    .copied()
                    .collect()
            }
        }
    }
}
```

### 3. Update CLI Usage

```rust
// Before
let is_dk = self.spec.class.to_lowercase() == "deathknight"
    || self.spec.class.to_lowercase() == "death_knight"
    || self.spec.class.to_lowercase() == "death knight";

// After
let class_id: ClassId = self.spec.class.parse()
    .map_err(|e: ParseClassError| {
        let mut msg = format!("unknown class: {}", self.spec.class);
        let suggestions = e.suggestions();
        if !suggestions.is_empty() {
            msg.push_str(&format!(", did you mean: {}?", suggestions.join(", ")));
        }
        ConfigError::UnknownClass { class_name: self.spec.class.clone() }
    })?;

let is_dk = class_id == ClassId::DeathKnight;
```

### 4. Same for SpecId

```rust
impl std::str::FromStr for SpecId {
    type Err = ParseSpecError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Expected format: "class:spec" or just "spec"
        let parts: Vec<&str> = s.split(':').collect();

        let spec_name = parts.last().unwrap();
        let normalized: String = spec_name.to_lowercase()
            .chars()
            .filter(|c| c.is_alphabetic())
            .collect();

        match normalized.as_str() {
            // Hunter
            "beastmastery" | "bm" => Ok(SpecId::BeastMastery),
            "marksmanship" | "mm" => Ok(SpecId::Marksmanship),
            "survival" | "sv" => Ok(SpecId::Survival),

            // Warrior
            "arms" => Ok(SpecId::Arms),
            "fury" => Ok(SpecId::Fury),
            "protection" | "prot" if class_hint == Some(ClassId::Warrior) => {
                Ok(SpecId::ProtectionWarrior)
            }

            // ... other specs

            _ => Err(ParseSpecError::Unknown(s.to_string())),
        }
    }
}
```

### 5. TOML Serde Integration

```rust
// For automatic parsing in TOML
impl<'de> Deserialize<'de> for ClassId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        s.parse().map_err(serde::de::Error::custom)
    }
}
```

Then in TOML config:

```toml
[spec]
class = "Hunter"  # Parsed to ClassId::Hunter
spec = "beast-mastery"  # Parsed to SpecId::BeastMastery
```

## Benefits

| Aspect              | String Matching | Enum Parsing          |
| ------------------- | --------------- | --------------------- |
| Compile-time safety | No              | Yes                   |
| Typo detection      | No              | Yes, with suggestions |
| Allocations         | Multiple        | Once                  |
| Exhaustiveness      | No              | Match requires all    |
| Refactoring         | Find/replace    | Compiler errors       |

## Impact

- Type-safe class/spec handling
- Better error messages with suggestions
- No more string allocation per check
- Easier to add new classes/specs

## Effort

Medium (4-6 hours)

## Tests Required

- Test all class name variants parse correctly
- Test typos return error with suggestion
- Test TOML deserialization works
- Test case insensitivity
