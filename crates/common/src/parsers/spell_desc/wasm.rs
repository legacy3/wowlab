//! WASM bindings for spell description analysis and rendering.
//!
//! Provides JavaScript-callable functions for analyzing dependencies and
//! rendering spell descriptions with a JavaScript resolver object.

use super::analyzer::analyze_dependencies;
use super::lexer::tokenize_to_fragments;
use super::parser::parse;
use super::renderer::render_with_resolver;
use super::resolver::SpellDescResolver;
use crate::types::spell_desc::SpellDescDependencies;
use wasm_bindgen::prelude::*;

/// A resolver that delegates to JavaScript functions.
///
/// The JavaScript object should have the following methods:
/// - `getEffectValue(spellId: number, effectIndex: number, varType: string): number | null`
/// - `getSpellValue(spellId: number, varType: string): string | null`
/// - `getPlayerStat(stat: string): number | null`
/// - `getCustomVar(name: string): number | null`
/// - `knowsSpell(spellId: number): boolean`
/// - `hasAura(auraId: number): boolean`
/// - `isClass(classId: number): boolean`
/// - `isMale(): boolean`
/// - `getSpellDescription(spellId: number): string | null`
/// - `getSpellName(spellId: number): string | null`
/// - `getSpellIcon(spellId: number): string | null`
pub struct JsResolver {
    get_effect_value: js_sys::Function,
    get_spell_value: js_sys::Function,
    get_player_stat: js_sys::Function,
    get_custom_var: js_sys::Function,
    knows_spell: js_sys::Function,
    has_aura: js_sys::Function,
    is_class: js_sys::Function,
    is_male: js_sys::Function,
    get_spell_description: js_sys::Function,
    get_spell_name: js_sys::Function,
    get_spell_icon: js_sys::Function,
}

impl JsResolver {
    /// Create a new JsResolver from a JavaScript object.
    fn from_js_object(obj: &JsValue) -> Result<Self, JsError> {
        let get_fn = |name: &str| -> Result<js_sys::Function, JsError> {
            let val = js_sys::Reflect::get(obj, &JsValue::from_str(name))
                .map_err(|_| JsError::new(&format!("Missing method: {}", name)))?;
            val.dyn_into::<js_sys::Function>()
                .map_err(|_| JsError::new(&format!("{} is not a function", name)))
        };

        Ok(Self {
            get_effect_value: get_fn("getEffectValue")?,
            get_spell_value: get_fn("getSpellValue")?,
            get_player_stat: get_fn("getPlayerStat")?,
            get_custom_var: get_fn("getCustomVar")?,
            knows_spell: get_fn("knowsSpell")?,
            has_aura: get_fn("hasAura")?,
            is_class: get_fn("isClass")?,
            is_male: get_fn("isMale")?,
            get_spell_description: get_fn("getSpellDescription")?,
            get_spell_name: get_fn("getSpellName")?,
            get_spell_icon: get_fn("getSpellIcon")?,
        })
    }

    /// Helper to build a JS array from arguments and call a function.
    fn build_args_array(args: &[JsValue]) -> js_sys::Array {
        let arr = js_sys::Array::new();
        for arg in args {
            arr.push(arg);
        }
        arr
    }

    fn call_get_number(&self, func: &js_sys::Function, args: &[JsValue]) -> Option<f64> {
        let this = JsValue::undefined();
        let arr = Self::build_args_array(args);
        let result = func.apply(&this, &arr).ok()?;
        if result.is_null() || result.is_undefined() {
            None
        } else {
            result.as_f64()
        }
    }

    fn call_get_string(&self, func: &js_sys::Function, args: &[JsValue]) -> Option<String> {
        let this = JsValue::undefined();
        let arr = Self::build_args_array(args);
        let result = func.apply(&this, &arr).ok()?;
        if result.is_null() || result.is_undefined() {
            None
        } else {
            result.as_string()
        }
    }

    fn call_get_bool(&self, func: &js_sys::Function, args: &[JsValue]) -> bool {
        let this = JsValue::undefined();
        let arr = Self::build_args_array(args);
        func.apply(&this, &arr)
            .ok()
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
    }
}

impl SpellDescResolver for JsResolver {
    fn get_effect_value(&self, spell_id: u32, effect_index: u8, var_type: &str) -> Option<f64> {
        self.call_get_number(
            &self.get_effect_value,
            &[
                JsValue::from(spell_id),
                JsValue::from(effect_index),
                JsValue::from_str(var_type),
            ],
        )
    }

    fn get_spell_value(&self, spell_id: u32, var_type: &str) -> Option<String> {
        self.call_get_string(
            &self.get_spell_value,
            &[JsValue::from(spell_id), JsValue::from_str(var_type)],
        )
    }

    fn get_player_stat(&self, stat: &str) -> Option<f64> {
        self.call_get_number(&self.get_player_stat, &[JsValue::from_str(stat)])
    }

    fn get_custom_var(&self, name: &str) -> Option<f64> {
        self.call_get_number(&self.get_custom_var, &[JsValue::from_str(name)])
    }

    fn knows_spell(&self, spell_id: u32) -> bool {
        self.call_get_bool(&self.knows_spell, &[JsValue::from(spell_id)])
    }

    fn has_aura(&self, aura_id: u32) -> bool {
        self.call_get_bool(&self.has_aura, &[JsValue::from(aura_id)])
    }

    fn is_class(&self, class_id: u32) -> bool {
        self.call_get_bool(&self.is_class, &[JsValue::from(class_id)])
    }

    fn is_male(&self) -> bool {
        self.call_get_bool(&self.is_male, &[])
    }

    fn get_spell_description(&self, spell_id: u32) -> Option<String> {
        self.call_get_string(&self.get_spell_description, &[JsValue::from(spell_id)])
    }

    fn get_spell_name(&self, spell_id: u32) -> Option<String> {
        self.call_get_string(&self.get_spell_name, &[JsValue::from(spell_id)])
    }

    fn get_spell_icon(&self, spell_id: u32) -> Option<String> {
        self.call_get_string(&self.get_spell_icon, &[JsValue::from(spell_id)])
    }
}

/// Result of analyzing a spell description.
/// Includes dependencies and any parse errors.
#[wasm_bindgen]
pub struct AnalyzeResult {
    dependencies: SpellDescDependencies,
    parse_errors: Vec<String>,
}

#[wasm_bindgen]
impl AnalyzeResult {
    /// Get the dependencies.
    #[wasm_bindgen(getter)]
    pub fn dependencies(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.dependencies).unwrap_or(JsValue::NULL)
    }

    /// Get parse errors.
    #[wasm_bindgen(getter, js_name = parseErrors)]
    pub fn parse_errors(&self) -> Vec<String> {
        self.parse_errors.clone()
    }

    /// Check if there were any parse errors.
    #[wasm_bindgen(js_name = hasErrors)]
    pub fn has_errors(&self) -> bool {
        !self.parse_errors.is_empty()
    }
}

/// Analyze a spell description and return its data dependencies.
///
/// This should be called first to determine what data needs to be fetched
/// before rendering the description.
///
/// # Arguments
/// * `input` - The spell description text
/// * `self_spell_id` - The spell ID of the spell being analyzed
///
/// # Returns
/// An `AnalyzeResult` object containing dependencies and any parse errors.
#[wasm_bindgen(js_name = analyzeSpellDesc)]
pub fn wasm_analyze_spell_desc(input: &str, self_spell_id: u32) -> AnalyzeResult {
    let result = parse(input);
    let dependencies = analyze_dependencies(&result.ast, self_spell_id);
    AnalyzeResult {
        dependencies,
        parse_errors: result.errors.iter().map(|e| e.to_string()).collect(),
    }
}

/// Render a spell description with the provided resolver.
///
/// Returns structured fragments instead of a plain string, allowing React
/// to render with proper styling without dangerouslySetInnerHTML.
///
/// # Arguments
/// * `input` - The spell description text
/// * `self_spell_id` - The spell ID of the spell being rendered
/// * `resolver` - A JavaScript object implementing the resolver interface
///
/// # Returns
/// A `SpellDescRenderResult` with fragments, parse errors, and warnings.
///
/// # JavaScript Resolver Interface
///
/// The resolver object must implement these methods:
/// ```javascript
/// {
///   getEffectValue(spellId: number, effectIndex: number, varType: string): number | null,
///   getSpellValue(spellId: number, varType: string): string | null,
///   getPlayerStat(stat: string): number | null,
///   getCustomVar(name: string): number | null,
///   knowsSpell(spellId: number): boolean,
///   hasAura(auraId: number): boolean,
///   isClass(classId: number): boolean,
///   isMale(): boolean,
///   getSpellDescription(spellId: number): string | null,
///   getSpellName(spellId: number): string | null,
///   getSpellIcon(spellId: number): string | null,
/// }
/// ```
#[wasm_bindgen(js_name = renderSpellDesc)]
pub fn wasm_render_spell_desc(
    input: &str,
    self_spell_id: u32,
    resolver: JsValue,
) -> Result<JsValue, JsError> {
    let js_resolver = JsResolver::from_js_object(&resolver)?;
    let result = parse(input);
    let parse_errors: Vec<String> = result.errors.iter().map(|e| e.to_string()).collect();
    let render_result =
        render_with_resolver(&result.ast, self_spell_id, &js_resolver, parse_errors);
    serde_wasm_bindgen::to_value(&render_result).map_err(|e| JsError::new(&e.to_string()))
}

/// Tokenize a spell description and return fragments for debug display.
///
/// Variables and expressions become RawToken fragments (for highlighting).
/// Plain text becomes Text fragments.
///
/// # Arguments
/// * `input` - The spell description text
///
/// # Returns
/// A vector of `SpellDescFragment` for rendering.
#[wasm_bindgen(js_name = tokenizeSpellDesc)]
pub fn wasm_tokenize_spell_desc(input: &str) -> JsValue {
    let fragments = tokenize_to_fragments(input);
    serde_wasm_bindgen::to_value(&fragments).unwrap_or(JsValue::NULL)
}
