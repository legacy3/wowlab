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
    "spells": [
        {
            "id": 34026,
            "name": "Kill Command",
            "cooldown": 7.5,
            "charges": 0,
            "gcd": 1.5,
            "cast_time": 0.0,
            "cost": {
                "resource_type": "focus",
                "amount": 30.0
            },
            "damage": {
                "base_min": 1000.0,
                "base_max": 1200.0,
                "ap_coefficient": 0.6,
                "sp_coefficient": 0.0
            },
            "effects": [],
            "is_gcd": true,
            "is_harmful": true
        },
        {
            "id": 193455,
            "name": "Cobra Shot",
            "cooldown": 0.0,
            "charges": 0,
            "gcd": 1.5,
            "cast_time": 0.0,
            "cost": {
                "resource_type": "focus",
                "amount": 35.0
            },
            "damage": {
                "base_min": 800.0,
                "base_max": 900.0,
                "ap_coefficient": 0.4,
                "sp_coefficient": 0.0
            },
            "effects": [],
            "is_gcd": true,
            "is_harmful": true
        }
    ],
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

            // Check DPS is reasonable (should be > 0 for a valid config)
            let mean_dps = value["mean_dps"].as_f64().unwrap();
            assert!(mean_dps > 0.0, "DPS should be positive, got {}", mean_dps);
            println!("Mean DPS: {:.0}", mean_dps);
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
fn test_invalid_rotation() {
    let bad_config = r#"{
        "player": {
            "name": "Test",
            "spec": "beast_mastery",
            "stats": {
                "strength": 0,
                "agility": 1000,
                "intellect": 0,
                "stamina": 1000,
                "crit_rating": 0,
                "haste_rating": 0,
                "mastery_rating": 0,
                "versatility_rating": 0
            },
            "resources": {
                "resource_type": "focus",
                "max": 100.0,
                "regen_per_second": 10.0,
                "initial": 100.0
            },
            "weapon_speed": 0.0,
            "weapon_damage": [0, 0]
        },
        "spells": [],
        "auras": [],
        "duration": 10.0,
        "target": {
            "level_diff": 0,
            "max_health": 1000000.0,
            "armor": 0.0
        },
        "rotation": "invalid rhai syntax {{{"
    }"#;

    let result = SimRunner::run(bad_config, 100, 12345);
    assert!(result.is_err(), "Should fail with invalid rotation");
}
