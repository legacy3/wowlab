//! Integration tests for spell description parsing and rendering
//!
//! Tests the full pipeline from raw description text to rendered output.
//! Comprehensive coverage of ALL variable types and features.

use wowlab_parsers::spell_desc::{
    parse, render_with_resolver, ParsedSpellDescription, SpellDescResolver, TestResolver,
};
use wowlab_types::spell_desc::SpellDescRenderResult;

/// Helper to render a spell description to plain text for tests.
fn render_to_text<R: SpellDescResolver>(
    ast: &ParsedSpellDescription,
    spell_id: u32,
    resolver: &R,
) -> String {
    let result = render_with_resolver(ast, spell_id, resolver, vec![]);
    result.to_plain_text()
}

/// Helper to get the render result for more detailed assertions.
#[allow(dead_code)]
fn render<R: SpellDescResolver>(
    ast: &ParsedSpellDescription,
    spell_id: u32,
    resolver: &R,
) -> SpellDescRenderResult {
    render_with_resolver(ast, spell_id, resolver, vec![])
}

// =============================================================================
// PARSING TESTS
// =============================================================================

#[test]
fn parse_simple_effect_variable() {
    let result = parse("Deals $s1 damage");
    assert!(!result.ast.nodes.is_empty());
    assert!(result.errors.is_empty());
}

#[test]
fn parse_uppercase_effect_variable() {
    let result = parse("Reduces damage by $S1%");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_cross_spell_reference() {
    let result = parse("Deals $207771s1 damage");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_cross_spell_ref_without_index() {
    // $1256306a should default to effect 1
    let result = parse("Damage within $1256306a yards");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_spell_weapon_variable() {
    let result = parse("Deals $sw2 damage");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_total_over_time_variable() {
    let result = parse("Deals $o1 damage over time");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_expression_with_trailing_decimal() {
    let result = parse("Duration increased by ${$s1/1000}.2 sec");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_conditional_with_aura() {
    let result = parse("$?a212612[Chaos Strike][Fracture]");
    assert!(!result.ast.nodes.is_empty());
}

#[test]
fn parse_at_spellname() {
    let result = parse("$@spellname442624");
    assert!(!result.ast.nodes.is_empty());
}

// =============================================================================
// EFFECT VARIABLES: $s, $S, $m, $M, $o, $t, $a, $A, $e, $w, $x, $bc, $q, $sw
// =============================================================================

#[test]
fn render_effect_s_base_points() {
    let result = parse("Deals $s1 damage");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 100.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 100 damage");
}

#[test]
fn render_effect_s_uppercase() {
    // $S1 is distinct from $s1 - case matters
    let result = parse("Reduces damage by $S1%");
    let resolver = TestResolver::new().with_effect(12345, 1, "S", -5.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Reduces damage by -5%");
}

#[test]
fn render_effect_m_min_value() {
    let result = parse("Deals $m1 to $M1 damage");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "m", 80.0)
        .with_effect(12345, 1, "M", 120.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 80 to 120 damage");
}

#[test]
fn render_effect_o_total_over_time() {
    let result = parse("Deals $o1 damage over time");
    let resolver = TestResolver::new().with_effect(12345, 1, "o", 1000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 1000 damage over time");
}

#[test]
fn render_effect_t_tick_period() {
    let result = parse("Every $t1 sec");
    let resolver = TestResolver::new().with_effect(12345, 1, "t", 2.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Every 2 sec");
}

#[test]
fn render_effect_a_radius_min_max() {
    let result = parse("Within $a1 to $A1 yards");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "a", 8.0)
        .with_effect(12345, 1, "A", 40.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Within 8 to 40 yards");
}

#[test]
fn render_effect_e_points_per_level() {
    let result = parse("Increases by $e1 per level");
    let resolver = TestResolver::new().with_effect(12345, 1, "e", 5.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Increases by 5 per level");
}

#[test]
fn render_effect_w_weapon_damage() {
    let result = parse("Deals $w1 weapon damage");
    let resolver = TestResolver::new().with_effect(12345, 1, "w", 150.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 150 weapon damage");
}

#[test]
fn render_effect_x_chain_targets() {
    let result = parse("Hits $x1 additional targets");
    let resolver = TestResolver::new().with_effect(12345, 1, "x", 3.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Hits 3 additional targets");
}

#[test]
fn render_effect_bc_bonus_coefficient() {
    let result = parse("Bonus: $bc1");
    let resolver = TestResolver::new().with_effect(12345, 1, "bc", 0.15);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Bonus: 15.0%");
}

#[test]
fn render_effect_q_misc() {
    let result = parse("Value: $q1");
    let resolver = TestResolver::new().with_effect(12345, 1, "q", 42.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Value: 42");
}

#[test]
fn render_effect_sw_spell_weapon() {
    let result = parse("Deals $sw2 damage");
    let resolver = TestResolver::new().with_effect(12345, 2, "sw", 500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 500 damage");
}

// =============================================================================
// SPELL-LEVEL VARIABLES: $d, $d1, $d2, $d3, $n, $u, $h, $r, $i, $p, $z, $c
// =============================================================================

#[test]
fn render_spell_d_duration() {
    let result = parse("Lasts for $d");
    let resolver = TestResolver::new().with_spell_value(12345, "d", "8 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Lasts for 8 sec");
}

#[test]
fn render_spell_d1_duration_variant() {
    let result = parse("Duration: $d1");
    let resolver = TestResolver::new().with_spell_value(12345, "d1", "10 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Duration: 10 sec");
}

#[test]
fn render_spell_d2_duration_variant() {
    let result = parse("Duration: $d2");
    let resolver = TestResolver::new().with_spell_value(12345, "d2", "15 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Duration: 15 sec");
}

#[test]
fn render_spell_d3_duration_variant() {
    let result = parse("Duration: $d3");
    let resolver = TestResolver::new().with_spell_value(12345, "d3", "20 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Duration: 20 sec");
}

#[test]
fn render_spell_n_targets() {
    let result = parse("Hits $n targets");
    let resolver = TestResolver::new().with_spell_value(12345, "n", "5");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Hits 5 targets");
}

#[test]
fn render_spell_u_stacks() {
    let result = parse("Up to $u stacks");
    let resolver = TestResolver::new().with_spell_value(12345, "u", "3");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Up to 3 stacks");
}

#[test]
fn render_spell_h_proc_chance() {
    let result = parse("$h% chance to proc");
    let resolver = TestResolver::new().with_spell_value(12345, "h", "15");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "15% chance to proc");
}

#[test]
fn render_spell_r_range() {
    let result = parse("Range: $r yards");
    let resolver = TestResolver::new().with_spell_value(12345, "r", "40");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Range: 40 yards");
}

#[test]
fn render_spell_i_misc() {
    let result = parse("Index: $i");
    let resolver = TestResolver::new().with_spell_value(12345, "i", "7");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Index: 7");
}

#[test]
fn render_spell_p_proc_per_minute() {
    let result = parse("$p procs per minute");
    let resolver = TestResolver::new().with_spell_value(12345, "p", "2.5");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "2.5 procs per minute");
}

#[test]
fn render_spell_z_home_location() {
    let result = parse("Returns to $z");
    let resolver = TestResolver::new().with_spell_value(12345, "z", "Orgrimmar");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Returns to Orgrimmar");
}

#[test]
fn render_spell_c_cooldown() {
    let result = parse("Cooldown: $c1 sec");
    let resolver = TestResolver::new().with_spell_value(12345, "c1", "30");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Cooldown: 30 sec");
}

// =============================================================================
// PLAYER VARIABLES: $SP, $sp, $AP, $ap, $RAP, $MHP, $mhp, $SPS, $PL, $pl, $INT
// =============================================================================

#[test]
fn render_player_sp_spell_power() {
    let result = parse("Scales with $SP spell power");
    let resolver = TestResolver::new().with_player_stat("SP", 5000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Scales with 5000 spell power");
}

#[test]
fn render_player_sp_lowercase() {
    let result = parse("$sp spell power");
    let resolver = TestResolver::new().with_player_stat("sp", 4500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "4500 spell power");
}

#[test]
fn render_player_ap_attack_power() {
    let result = parse("$AP attack power");
    let resolver = TestResolver::new().with_player_stat("AP", 8000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "8000 attack power");
}

#[test]
fn render_player_ap_lowercase() {
    let result = parse("$ap attack power");
    let resolver = TestResolver::new().with_player_stat("ap", 7500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "7500 attack power");
}

#[test]
fn render_player_rap_ranged_attack_power() {
    let result = parse("$RAP ranged attack power");
    let resolver = TestResolver::new().with_player_stat("RAP", 6000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "6000 ranged attack power");
}

#[test]
fn render_player_mhp_max_health() {
    let result = parse("$MHP max health");
    let resolver = TestResolver::new().with_player_stat("MHP", 500000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "500000 max health");
}

#[test]
fn render_player_mhp_lowercase() {
    let result = parse("$mhp health");
    let resolver = TestResolver::new().with_player_stat("mhp", 450000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "450000 health");
}

#[test]
fn render_player_sps_spell_power_scaling() {
    let result = parse("$SPS scaling");
    let resolver = TestResolver::new().with_player_stat("SPS", 1.25);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1.25 scaling");
}

#[test]
fn render_player_pl_level() {
    let result = parse("Level $PL");
    let resolver = TestResolver::new().with_player_stat("PL", 80.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Level 80");
}

#[test]
fn render_player_pl_lowercase() {
    let result = parse("Level $pl");
    let resolver = TestResolver::new().with_player_stat("pl", 70.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Level 70");
}

#[test]
fn render_player_int_intellect() {
    let result = parse("$INT intellect");
    let resolver = TestResolver::new().with_player_stat("INT", 3500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "3500 intellect");
}

// =============================================================================
// ENCHANT VARIABLES: $ec1, $ecix, $ecd
// =============================================================================

#[test]
fn render_enchant_ec1() {
    let result = parse("Enchant: $ec1");
    let resolver = TestResolver::new().with_spell_value(12345, "ec1", "Fiery Weapon");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Enchant: Fiery Weapon");
}

#[test]
fn render_enchant_ecix() {
    let result = parse("Enchant index: $ecix");
    let resolver = TestResolver::new().with_spell_value(12345, "ecix", "5");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Enchant index: 5");
}

#[test]
fn render_enchant_ecd() {
    let result = parse("Enchant desc: $ecd");
    let resolver = TestResolver::new().with_spell_value(12345, "ecd", "Adds fire damage");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Enchant desc: Adds fire damage");
}

// =============================================================================
// MISC VARIABLES: $maxcast, $pctD, $W, $W2, $B, $ctrmax
// =============================================================================

#[test]
fn render_misc_maxcast() {
    let result = parse("Max cast: $maxcast");
    let resolver = TestResolver::new().with_spell_value(12345, "maxcast", "3");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Max cast: 3");
}

#[test]
fn render_misc_pctd() {
    let result = parse("$pctD of duration");
    let resolver = TestResolver::new().with_spell_value(12345, "pctD", "50%");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "50% of duration");
}

#[test]
fn render_misc_w() {
    let result = parse("Weapon: $W");
    let resolver = TestResolver::new().with_spell_value(12345, "W", "Main Hand");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Weapon: Main Hand");
}

#[test]
fn render_effect_capital_w2_weapon_damage() {
    // $W2 is effect variable for weapon damage at effect 2 (capital W)
    let result = parse("Offhand: $W2");
    let resolver = TestResolver::new().with_effect(12345, 2, "W", 150.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Offhand: 150");
}

#[test]
fn render_misc_b() {
    let result = parse("Bundle: $B");
    let resolver = TestResolver::new().with_spell_value(12345, "B", "Item Bundle");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Bundle: Item Bundle");
}

#[test]
fn render_misc_ctrmax() {
    let result = parse("Counter max: $ctrmax1");
    let resolver = TestResolver::new().with_spell_value(12345, "ctrmax1", "10");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Counter max: 10");
}

// NEW MISC VARIABLES: weapon stats, proc data, mastery, etc.

#[test]
fn render_misc_mws_weapon_speed() {
    let result = parse("Speed: $mws");
    let resolver = TestResolver::new().with_spell_value(12345, "mws", "2.6");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Speed: 2.6");
}

#[test]
fn render_misc_mwb_weapon_dps() {
    let result = parse("DPS: $mwb");
    let resolver = TestResolver::new().with_spell_value(12345, "mwb", "125");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "DPS: 125");
}

#[test]
fn render_misc_proccooldown() {
    let result = parse("ICD: $proccooldown sec");
    let resolver = TestResolver::new().with_spell_value(12345, "proccooldown", "1.5");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "ICD: 1.5 sec");
}

#[test]
fn render_misc_procrppm() {
    let result = parse("RPPM: $procrppm");
    let resolver = TestResolver::new().with_spell_value(12345, "procrppm", "2.0");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "RPPM: 2.0");
}

#[test]
fn render_misc_mastery() {
    let result = parse("Mastery: $mastery%");
    let resolver = TestResolver::new().with_spell_value(12345, "mastery", "40");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Mastery: 40%");
}

#[test]
fn render_misc_mas_short() {
    let result = parse("$mas% mastery");
    let resolver = TestResolver::new().with_spell_value(12345, "mas", "32");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "32% mastery");
}

#[test]
fn render_misc_lpoint() {
    let result = parse("Level point: $lpoint");
    let resolver = TestResolver::new().with_spell_value(12345, "lpoint", "5");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Level point: 5");
}

// NEW ENCHANT VARIABLES

#[test]
fn render_enchant_ec2() {
    let result = parse("Enchant 2: $ec2");
    let resolver = TestResolver::new().with_spell_value(12345, "ec2", "75");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Enchant 2: 75");
}

#[test]
fn render_enchant_ecim() {
    let result = parse("Enchant IM: $ecim");
    let resolver = TestResolver::new().with_spell_value(12345, "ecim", "100");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Enchant IM: 100");
}

#[test]
fn render_enchant_ec1s1_combined() {
    let result = parse("Combined: $ec1s1");
    let resolver = TestResolver::new().with_spell_value(12345, "ec1s1", "150");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Combined: 150");
}

// NEW EFFECT VARIABLE: Capital W (weapon damage)

#[test]
fn render_effect_capital_w1_weapon_damage() {
    // $W1 is effect variable for weapon damage at effect 1 (capital W)
    let result = parse("Damage: $W1");
    let resolver = TestResolver::new().with_effect(12345, 1, "W", 200.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Damage: 200");
}

#[test]
fn render_effect_capital_w3_weapon_damage() {
    // $W3 is effect variable for weapon damage at effect 3
    let result = parse("Effect 3: $W3");
    let resolver = TestResolver::new().with_effect(12345, 3, "W", 300.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Effect 3: 300");
}

// =============================================================================
// CUSTOM VARIABLES: $<varname>
// =============================================================================

#[test]
fn render_custom_variable() {
    let result = parse("Heals for $<healing>");
    let resolver = TestResolver::new().with_custom_var("healing", 250.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Heals for 250");
}

#[test]
fn render_custom_variable_in_expression() {
    let result = parse("${$<damage> * 2}");
    let resolver = TestResolver::new().with_custom_var("damage", 100.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "200");
}

// =============================================================================
// @ VARIABLES: $@spellname, $@spelldesc, $@versadmg, etc.
// =============================================================================

#[test]
fn render_at_spellname() {
    let result = parse("Target of $@spellname442624");
    let resolver = TestResolver::new().with_spell_name(442624, "Reaver's Mark");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Target of Reaver's Mark");
}

#[test]
fn render_at_spelldesc() {
    let result = parse("$@spelldesc99999");
    let resolver = TestResolver::new().with_spell_description(99999, "A powerful attack");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "A powerful attack");
}

#[test]
fn render_at_spellname_and_desc() {
    let result = parse("$@spellname442294: $@spelldesc442294");
    let resolver = TestResolver::new()
        .with_spell_name(442294, "Reaver's Glaive")
        .with_spell_description(442294, "A powerful glaive attack");
    let rendered = render_to_text(&result.ast, 442290, &resolver);
    assert_eq!(rendered, "Reaver's Glaive: A powerful glaive attack");
}

// =============================================================================
// CROSS-SPELL REFERENCES: $123456s1, $123456d, $123456bc1
// =============================================================================

#[test]
fn render_cross_spell_effect() {
    let result = parse("Deals $207771s1 damage");
    let resolver = TestResolver::new().with_effect(207771, 1, "s", 50.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 50 damage");
}

#[test]
fn render_cross_spell_duration() {
    let result = parse("Lasts $207693d");
    let resolver = TestResolver::new().with_spell_value(207693, "d", "6 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Lasts 6 sec");
}

#[test]
fn render_cross_spell_total_over_time() {
    let result = parse("Heals for $207693o1 over $207693d");
    let resolver = TestResolver::new()
        .with_effect(207693, 1, "o", 5000.0)
        .with_spell_value(207693, "d", "6 sec");
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Heals for 5000 over 6 sec");
}

#[test]
fn render_cross_spell_ref_without_index() {
    // $1256306a defaults to effect 1
    let result = parse("Damage within $1256306a yards");
    let resolver = TestResolver::new().with_effect(1256306, 1, "a", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Damage within 10 yards");
}

#[test]
fn render_cross_spell_uppercase() {
    // $442715S1 is distinct from $442715s1 - case matters
    let result = parse("Reduces by $442715S1%");
    let resolver = TestResolver::new().with_effect(442715, 1, "S", 5.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Reduces by 5%");
}

// CROSS-SPELL: $o (over time) and $sw (spell weapon)

#[test]
fn render_cross_spell_o_over_time() {
    let result = parse("Heals for $207693o1 over 6 sec");
    let resolver = TestResolver::new().with_effect(207693, 1, "o", 500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Heals for 500 over 6 sec");
}

#[test]
fn render_cross_spell_sw_spell_weapon() {
    let result = parse("Deal $213243sw2 damage");
    let resolver = TestResolver::new().with_effect(213243, 2, "sw", 1500.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deal 1500 damage");
}

// =============================================================================
// EXPRESSIONS: ${...}
// =============================================================================

#[test]
fn render_expression_addition() {
    let result = parse("${$s1 + $s2}");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 10.0)
        .with_effect(12345, 2, "s", 20.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "30");
}

#[test]
fn render_expression_subtraction() {
    let result = parse("${$s1 - $s2}");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 100.0)
        .with_effect(12345, 2, "s", 30.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "70");
}

#[test]
fn render_expression_multiplication() {
    let result = parse("Deals ${$s1 * 2} damage");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 50.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 100 damage");
}

#[test]
fn render_expression_division() {
    let result = parse("${$s1 / 1000} sec");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 2000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "2 sec");
}

#[test]
fn render_expression_negation() {
    let result = parse("${-$s1}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "-10");
}

#[test]
fn render_expression_parentheses() {
    let result = parse("${($s1 + $s2) * 2}");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 10.0)
        .with_effect(12345, 2, "s", 5.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "30");
}

#[test]
fn render_expression_with_player_stat() {
    let result = parse("${$MHP * $s1 / 100}");
    let resolver = TestResolver::new()
        .with_player_stat("MHP", 500000.0)
        .with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "50000");
}

// =============================================================================
// EXPRESSION FUNCTIONS: $max, $min, $floor, $gt, $gte, $lt, $lte, $cond, $clamp
// =============================================================================

#[test]
fn render_function_max() {
    let result = parse("${$max($s1, $s2)}");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 10.0)
        .with_effect(12345, 2, "s", 20.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "20");
}

#[test]
fn render_function_min() {
    let result = parse("${$min($s1, $s2)}");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 10.0)
        .with_effect(12345, 2, "s", 20.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "10");
}

#[test]
fn render_function_floor() {
    let result = parse("${$floor($s1 / 3)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "3");
}

#[test]
fn render_function_gt() {
    let result = parse("${$gt($s1, 5)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1"); // true = 1
}

#[test]
fn render_function_gt_false() {
    let result = parse("${$gt($s1, 15)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "0"); // false = 0
}

#[test]
fn render_function_gte() {
    let result = parse("${$gte($s1, 10)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1");
}

#[test]
fn render_function_lt() {
    let result = parse("${$lt($s1, 15)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1");
}

#[test]
fn render_function_lte() {
    let result = parse("${$lte($s1, 10)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1");
}

#[test]
fn render_function_cond_true() {
    // $cond(condition, true_val, false_val)
    let result = parse("${$cond($gt($s1, 5), 100, 50)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "100");
}

#[test]
fn render_function_cond_false() {
    let result = parse("${$cond($gt($s1, 15), 100, 50)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 10.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "50");
}

#[test]
fn render_function_clamp() {
    // $clamp(value, min, max)
    let result = parse("${$clamp($s1, 5, 15)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 20.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "15");
}

#[test]
fn render_function_clamp_lower() {
    let result = parse("${$clamp($s1, 5, 15)}");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 2.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "5");
}

// =============================================================================
// DECIMAL FORMAT: .1, .2, etc.
// =============================================================================

#[test]
fn render_decimal_format_1() {
    let result = parse("${$s1/10}.1%");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 21.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "2.1%");
}

#[test]
fn render_decimal_format_2() {
    let result = parse("${$s1/1000}.2 sec");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 250.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "0.25 sec");
}

#[test]
fn render_decimal_format_with_negation() {
    let result = parse("${-$s1/1000}.1 sec");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 1000.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "-1.0 sec");
}

// =============================================================================
// CONDITIONALS: $?a (aura), $?s (spell), $?c (class)
// =============================================================================

#[test]
fn render_conditional_aura_true() {
    let result = parse("$?a212612[Chaos Strike][Fracture]");
    let resolver = TestResolver::new().with_active_aura(212612);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Chaos Strike");
}

#[test]
fn render_conditional_aura_false() {
    let result = parse("$?a212612[Chaos Strike][Fracture]");
    let resolver = TestResolver::new();
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Fracture");
}

#[test]
fn render_conditional_spell_known_true() {
    let result = parse("$?s99999[Extra damage][Normal damage]");
    let resolver = TestResolver::new().with_known_spell(99999);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Extra damage");
}

#[test]
fn render_conditional_spell_known_false() {
    let result = parse("$?s99999[Extra damage][Normal damage]");
    let resolver = TestResolver::new();
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Normal damage");
}

#[test]
fn render_conditional_class_match() {
    let result = parse("$?c7[Mage bonus][Other]");
    let resolver = TestResolver::new().with_class(7);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Mage bonus");
}

#[test]
fn render_conditional_class_no_match() {
    let result = parse("$?c7[Mage bonus][Other]");
    let resolver = TestResolver::new().with_class(1);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Other");
}

#[test]
fn render_chained_conditional() {
    let result = parse("$?a212613[Infernal Strike]?s195072[Fel Rush][Shift]");

    let resolver1 = TestResolver::new().with_active_aura(212613);
    assert_eq!(
        render_to_text(&result.ast, 1, &resolver1),
        "Infernal Strike"
    );

    let resolver2 = TestResolver::new().with_known_spell(195072);
    assert_eq!(render_to_text(&result.ast, 1, &resolver2), "Fel Rush");

    let resolver3 = TestResolver::new();
    assert_eq!(render_to_text(&result.ast, 1, &resolver3), "Shift");
}

#[test]
fn render_conditional_with_variables() {
    let result = parse("Consuming $?a212612[$s1][$s2] Soul Fragments");
    let resolver = TestResolver::new()
        .with_effect(442290, 1, "s", 30.0)
        .with_effect(442290, 2, "s", 20.0)
        .with_active_aura(212612);
    let rendered = render_to_text(&result.ast, 442290, &resolver);
    assert_eq!(rendered, "Consuming 30 Soul Fragments");
}

#[test]
fn render_conditional_empty_branch() {
    let result = parse("$?c7[Mage bonus][]");
    let resolver = TestResolver::new().with_class(7);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Mage bonus");
}

// =============================================================================
// PLURALIZATION: $l and $L
// =============================================================================

#[test]
fn render_pluralization_singular() {
    let result = parse("$s1 $ltarget:targets;");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 1.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "1 target");
}

#[test]
fn render_pluralization_plural() {
    let result = parse("$s1 $ltarget:targets;");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 5.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "5 targets");
}

#[test]
fn render_pluralization_zero() {
    let result = parse("$s1 $ltarget:targets;");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 0.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "0 targets");
}

#[test]
fn render_capitalized_pluralization() {
    let result = parse("$s1 Soul $LFragment:Fragments;");

    let resolver_single = TestResolver::new().with_effect(1, 1, "s", 1.0);
    assert_eq!(
        render_to_text(&result.ast, 1, &resolver_single),
        "1 Soul Fragment"
    );

    let resolver_plural = TestResolver::new().with_effect(1, 1, "s", 3.0);
    assert_eq!(
        render_to_text(&result.ast, 1, &resolver_plural),
        "3 Soul Fragments"
    );
}

// =============================================================================
// GENDER: $g and $G
// =============================================================================

#[test]
fn render_gender_male() {
    let result = parse("$ghis:her; spell");
    let resolver = TestResolver::new().with_gender(true);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "his spell");
}

#[test]
fn render_gender_female() {
    let result = parse("$ghis:her; spell");
    let resolver = TestResolver::new().with_gender(false);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "her spell");
}

#[test]
fn render_gender_he_she() {
    let result = parse("$gHe:She; attacks");
    let resolver_male = TestResolver::new().with_gender(true);
    assert_eq!(
        render_to_text(&result.ast, 1, &resolver_male),
        "He attacks"
    );

    let resolver_female = TestResolver::new().with_gender(false);
    assert_eq!(
        render_to_text(&result.ast, 1, &resolver_female),
        "She attacks"
    );
}

// =============================================================================
// COLOR CODES
// =============================================================================

#[test]
fn render_color_codes_as_fragments() {
    use wowlab_types::spell_desc::SpellDescFragment;
    let result = parse("|cFFFFFFFFGenerates $s1 Fury.|r");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 20.0);
    let rendered = render(&result.ast, 12345, &resolver);
    // Check fragments contain color codes
    assert!(rendered.fragments.iter().any(|f| matches!(f, SpellDescFragment::ColorStart { color } if color == "cFFFFFFFF")));
    assert!(rendered.fragments.iter().any(|f| matches!(f, SpellDescFragment::ColorEnd)));
    // Plain text should strip colors
    assert_eq!(rendered.to_plain_text(), "Generates 20 Fury.");
}

#[test]
fn render_color_code_green_fragments() {
    use wowlab_types::spell_desc::SpellDescFragment;
    let result = parse("|cFF00FF00Green text|r normal");
    let resolver = TestResolver::new();
    let rendered = render(&result.ast, 12345, &resolver);
    // Check green color fragment exists
    assert!(rendered.fragments.iter().any(|f| matches!(f, SpellDescFragment::ColorStart { color } if color == "cFF00FF00")));
    // Plain text should strip colors
    assert_eq!(rendered.to_plain_text(), "Green text normal");
}

// =============================================================================
// EDGE CASES
// =============================================================================

#[test]
fn render_unresolved_variable_shows_original() {
    let result = parse("Deals $s1 damage");
    let resolver = TestResolver::new();
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals $s1 damage");
}

#[test]
fn render_mixed_resolved_unresolved() {
    let result = parse("Deals $s1 to $s2 damage");
    let resolver = TestResolver::new().with_effect(12345, 1, "s", 100.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 100 to $s2 damage");
}

#[test]
fn render_empty_string() {
    let result = parse("");
    let resolver = TestResolver::new();
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "");
}

#[test]
fn render_plain_text_only() {
    let result = parse("Just plain text with no variables");
    let resolver = TestResolver::new();
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Just plain text with no variables");
}

#[test]
fn render_multiple_effect_indices() {
    let result = parse("$s1-$s2% of $s3-$s4");
    let resolver = TestResolver::new()
        .with_effect(12345, 1, "s", 15.0)
        .with_effect(12345, 2, "s", 30.0)
        .with_effect(12345, 3, "s", 15.0)
        .with_effect(12345, 4, "s", 30.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "15-30% of 15-30");
}

// =============================================================================
// REAL SPELL DESCRIPTION TESTS
// =============================================================================

#[test]
fn render_burning_alive() {
    let result = parse("Every $207771t3 sec, Fiery Brand spreads to one nearby enemy.");
    let resolver = TestResolver::new().with_effect(207771, 3, "t", 1.0);
    let rendered = render_to_text(&result.ast, 207739, &resolver);
    assert_eq!(
        rendered,
        "Every 1 sec, Fiery Brand spreads to one nearby enemy."
    );
}

#[test]
fn render_charred_flesh() {
    let result = parse("Duration increased by ${$s1/1000}.2 sec");
    let resolver = TestResolver::new().with_effect(336639, 1, "s", 250.0);
    let rendered = render_to_text(&result.ast, 336639, &resolver);
    assert_eq!(rendered, "Duration increased by 0.25 sec");
}

#[test]
fn render_feed_the_demon() {
    let result = parse("Every $s1 Fury spent reduces cooldown by ${$s2/1000}.2 sec");
    let resolver = TestResolver::new()
        .with_effect(218612, 1, "s", 20.0)
        .with_effect(218612, 2, "s", 1000.0);
    let rendered = render_to_text(&result.ast, 218612, &resolver);
    assert_eq!(
        rendered,
        "Every 20 Fury spent reduces cooldown by 1.00 sec"
    );
}

#[test]
fn render_chains_of_anger() {
    let result = parse("Duration by ${$s2/1000} sec and radius by $s1 yds");
    let resolver = TestResolver::new()
        .with_effect(389715, 1, "s", 2.0)
        .with_effect(389715, 2, "s", 2000.0);
    let rendered = render_to_text(&result.ast, 389715, &resolver);
    assert_eq!(rendered, "Duration by 2 sec and radius by 2 yds");
}

#[test]
fn render_revel_in_pain() {
    let result = parse("${$s1/10}.1% shields you, up to ${$MHP*$s2/100}");
    let resolver = TestResolver::new()
        .with_effect(343014, 1, "s", 20.0)
        .with_effect(343014, 2, "s", 10.0)
        .with_player_stat("MHP", 500000.0);
    let rendered = render_to_text(&result.ast, 343014, &resolver);
    assert_eq!(rendered, "2.0% shields you, up to 50000");
}

#[test]
fn render_voidfall_radius() {
    let result = parse("Damage within $1256306a yards");
    let resolver = TestResolver::new().with_effect(1256306, 1, "a", 10.0);
    let rendered = render_to_text(&result.ast, 1253304, &resolver);
    assert_eq!(rendered, "Damage within 10 yards");
}

#[test]
fn render_army_unto_oneself() {
    let result = parse("reducing damage taken by $442715s1% for $442715d");
    let resolver = TestResolver::new()
        .with_effect(442715, 1, "s", 10.0)
        .with_spell_value(442715, "d", "6 sec");
    let rendered = render_to_text(&result.ast, 442714, &resolver);
    assert_eq!(rendered, "reducing damage taken by 10% for 6 sec");
}

#[test]
fn render_agonizing_flames() {
    let result = parse("Immolation Aura increases your movement speed by $s1% and its duration is increased by $s2%.");
    let resolver = TestResolver::new()
        .with_effect(207548, 1, "s", 10.0)
        .with_effect(207548, 2, "s", 50.0);
    let rendered = render_to_text(&result.ast, 207548, &resolver);
    assert_eq!(rendered, "Immolation Aura increases your movement speed by 10% and its duration is increased by 50%.");
}

#[test]
fn render_bouncing_glaives() {
    let result = parse("Throw Glaive ricochets to $s1 additional $ltarget:targets;.");
    let resolver = TestResolver::new().with_effect(320386, 1, "s", 3.0);
    let rendered = render_to_text(&result.ast, 320386, &resolver);
    assert_eq!(
        rendered,
        "Throw Glaive ricochets to 3 additional targets."
    );
}

#[test]
fn render_darkglare_boon() {
    let result = parse("refreshes $s1-$s2% of its cooldown and refunds $s3-$s4 Fury");
    let resolver = TestResolver::new()
        .with_effect(389708, 1, "s", 15.0)
        .with_effect(389708, 2, "s", 30.0)
        .with_effect(389708, 3, "s", 15.0)
        .with_effect(389708, 4, "s", 30.0);
    let rendered = render_to_text(&result.ast, 389708, &resolver);
    assert_eq!(
        rendered,
        "refreshes 15-30% of its cooldown and refunds 15-30 Fury"
    );
}

// =============================================================================
// @SPELLDESC RECURSIVE RENDERING
// =============================================================================

#[test]
fn render_spelldesc_recursive_with_conditional() {
    // Test that @spelldesc recursively renders conditionals inside the embedded description
    // Spell 395020 has description: "$?a388114[Chaos][Fire]"
    let result = parse("Deals $@spelldesc395020 damage.");
    let resolver = TestResolver::new()
        .with_spell_description(395020, "$?a388114[Chaos][Fire]")
        .with_active_aura(388114);
    let rendered = render_to_text(&result.ast, 232893, &resolver);
    assert_eq!(rendered, "Deals Chaos damage.");
}

#[test]
fn render_spelldesc_recursive_without_aura() {
    // When aura 388114 is not active, should show "Fire"
    let result = parse("Deals $@spelldesc395020 damage.");
    let resolver = TestResolver::new()
        .with_spell_description(395020, "$?a388114[Chaos][Fire]");
    let rendered = render_to_text(&result.ast, 232893, &resolver);
    assert_eq!(rendered, "Deals Fire damage.");
}

#[test]
fn render_spelldesc_recursive_with_variables() {
    // Test recursive rendering with variables inside embedded description
    let result = parse("Deals $@spelldesc99999 damage.");
    let resolver = TestResolver::new()
        .with_spell_description(99999, "$s1 to $s2")
        .with_effect(99999, 1, "s", 100.0)
        .with_effect(99999, 2, "s", 200.0);
    let rendered = render_to_text(&result.ast, 12345, &resolver);
    assert_eq!(rendered, "Deals 100 to 200 damage.");
}

#[test]
fn test_tokenize_color_fragments() {
    use wowlab_parsers::spell_desc::tokenize_to_fragments;
    use wowlab_types::spell_desc::SpellDescFragment;

    let input = "|cFFFFFFFFMograine|r casts death";
    let fragments = tokenize_to_fragments(input);

    println!("Fragments: {:#?}", fragments);

    // Check we got ColorStart, Text, ColorEnd, Text
    assert!(matches!(fragments.get(0), Some(SpellDescFragment::ColorStart { .. })));
    assert!(matches!(fragments.get(1), Some(SpellDescFragment::Text { .. })));
    assert!(matches!(fragments.get(2), Some(SpellDescFragment::ColorEnd)));
    assert!(matches!(fragments.get(3), Some(SpellDescFragment::Text { .. })));
}
