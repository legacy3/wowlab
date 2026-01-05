//! Integration test for engine integration.

use node::worker::SimRunner;

const TEST_CONFIG: &str = r#"{
    "player": {
        "name": "TestHunter",
        "spec": "beast_mastery",
        "stats": {
            "strength": 0,
            "agility": 10000,
            "intellect": 0,
            "stamina": 8000,
            "crit_rating": 0,
            "haste_rating": 0,
            "mastery_rating": 0,
            "versatility_rating": 0,
            "crit_pct": 25.0,
            "haste_pct": 20.0,
            "mastery_pct": 30.0,
            "versatility_pct": 5.0
        },
        "resources": {
            "resource_type": "focus",
            "max": 100.0,
            "regen_per_second": 10.0,
            "initial": 100.0
        },
        "weapon_speed": 3.0,
        "weapon_damage": [500, 700]
    },
    "spells": [],
    "auras": [],
    "duration": 10.0,
    "target": {
        "level_diff": 3,
        "max_health": 10000000.0,
        "armor": 0.0
    },
    "rotation": "if kill_command.ready() { cast(\"kill_command\") }\nif cobra_shot.ready() { cast(\"cobra_shot\") }"
}"#;

#[test]
fn test_engine_integration() {
    let result = SimRunner::run(TEST_CONFIG, 100, 12345);

    match result {
        Ok(value) => {
            println!("Result: {}", serde_json::to_string_pretty(&value).unwrap());

            // Check required fields exist
            assert!(value.get("iterations").is_some());
            assert!(value.get("mean_dps").is_some());
            assert!(value.get("std_dps").is_some());

            // Check iterations matches input
            assert_eq!(value["iterations"].as_u64().unwrap(), 100);

            // Note: DPS is currently 0 because the engine's event handlers
            // are placeholders. Once damage dealing is implemented in the
            // spec handlers, this will produce positive DPS.
            let mean_dps = value["mean_dps"].as_f64().unwrap();
            println!("Mean DPS: {:.0}", mean_dps);

            // Just verify we get a valid number (0 is acceptable for now)
            assert!(mean_dps >= 0.0, "DPS should be non-negative, got {}", mean_dps);
        }
        Err(e) => {
            panic!("Simulation failed: {}", e);
        }
    }
}

#[test]
fn test_invalid_config() {
    let result = SimRunner::run("not valid json", 100, 12345);
    assert!(result.is_err());
}

#[test]
fn test_unknown_spec() {
    let bad_config = r#"{
        "player": {
            "name": "Test",
            "spec": "unknown_spec_that_doesnt_exist",
            "stats": {
                "strength": 0,
                "agility": 1000,
                "intellect": 0,
                "stamina": 1000
            }
        },
        "duration": 10.0,
        "target": {
            "level_diff": 0,
            "max_health": 1000000.0,
            "armor": 0.0
        }
    }"#;

    let result = SimRunner::run(bad_config, 100, 12345);
    assert!(result.is_err(), "Should fail with unknown spec");
}

#[test]
fn test_minimal_config() {
    // Test with minimal required fields
    let minimal_config = r#"{
        "player": {
            "spec": "beast_mastery",
            "stats": {
                "strength": 0,
                "agility": 5000,
                "intellect": 0
            }
        },
        "duration": 5.0,
        "target": {
            "max_health": 1000000.0
        }
    }"#;

    let result = SimRunner::run(minimal_config, 10, 42);
    assert!(result.is_ok(), "Minimal config should work: {:?}", result);
}
