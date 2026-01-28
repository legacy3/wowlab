//! WASM bindings for the common crate.
//!
//! This module provides JavaScript-callable functions for:
//! - SimC parsing
//! - Spell description parsing and rendering
//! - Talent loadout encoding/decoding
//! - Item scaling calculations
//! - Node authentication (crypto)

use wasm_bindgen::prelude::*;

use crate::parsers::{
    apply_item_bonuses, encode_minimal_loadout, parse_simc, parse_spell_desc,
    ParsedSpellDescription, Profile,
};
use crate::types::data::{ItemQuality, ItemScalingData, ItemStat};

// Re-export spell description WASM functions from parsers
pub use crate::parsers::spell_desc::{
    wasm_analyze_spell_desc, wasm_render_spell_desc, AnalyzeResult,
};

// Re-export tokenize function
pub use crate::parsers::spell_desc::wasm_tokenize_spell_desc;

/// Parse a SimC profile string and return the result as a Profile object.
#[wasm_bindgen(js_name = parseSimc)]
pub fn wasm_parse_simc(input: &str) -> Result<Profile, JsError> {
    parse_simc(input).map_err(|e| JsError::new(&e.to_string()))
}

/// Parse a spell description string and return the AST.
#[wasm_bindgen(js_name = parseSpellDesc)]
pub fn wasm_parse_spell_desc(input: &str) -> Result<ParsedSpellDescription, JsError> {
    let result = parse_spell_desc(input);
    if result.errors.is_empty() {
        Ok(result.ast)
    } else {
        Err(JsError::new(
            &result
                .errors
                .iter()
                .map(|e| e.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        ))
    }
}

/// Encode a minimal loadout string for a spec with no talent selections.
#[wasm_bindgen(js_name = encodeMinimalLoadout)]
pub fn wasm_encode_minimal_loadout(spec_id: u16) -> String {
    encode_minimal_loadout(spec_id)
}

/// Apply item bonuses to compute scaled stats.
///
/// Takes base item info and bonus IDs, returns computed stats.
#[wasm_bindgen(js_name = applyItemBonuses)]
pub fn wasm_apply_item_bonuses(
    base_item_level: i32,
    base_stats: JsValue,
    quality: i32,
    bonus_ids: JsValue,
    scaling_data: JsValue,
    player_level: Option<i32>,
) -> JsValue {
    let base_stats: Vec<ItemStat> = match serde_wasm_bindgen::from_value(base_stats) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    let bonus_ids: Vec<i32> = match serde_wasm_bindgen::from_value(bonus_ids) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };

    let result = apply_item_bonuses(
        base_item_level,
        &base_stats,
        quality,
        &bonus_ids,
        &scaling_data,
        player_level,
    );

    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

/// Interpolate a curve at a given x value.
#[wasm_bindgen(js_name = interpolateCurve)]
pub fn wasm_interpolate_curve(scaling_data: JsValue, curve_id: i32, x: f64) -> JsValue {
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    match crate::parsers::interpolate_curve(&scaling_data, curve_id, x) {
        Some(v) => JsValue::from_f64(v),
        None => JsValue::NULL,
    }
}

/// Get the stat budget for an item level and quality.
#[wasm_bindgen(js_name = getStatBudget)]
pub fn wasm_get_stat_budget(
    scaling_data: JsValue,
    item_level: i32,
    quality: i32,
    slot_index: usize,
) -> JsValue {
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    match crate::parsers::get_stat_budget(
        &scaling_data,
        item_level,
        ItemQuality::from(quality),
        slot_index,
    ) {
        Some(v) => JsValue::from_f64(v),
        None => JsValue::NULL,
    }
}

/// Get a human-readable name for a stat type ID.
#[wasm_bindgen(js_name = getStatName)]
pub fn wasm_get_stat_name(stat_type: i32) -> String {
    crate::parsers::get_stat_name(stat_type).to_string()
}

// Crypto WASM Bindings (Node Authentication)

#[cfg(feature = "crypto")]
mod crypto_wasm {
    use super::*;
    use crate::parsers::crypto;

    /// Generate a new node keypair.
    ///
    /// Returns an object with `privateKey`, `publicKey`, and `claimCode` fields (all base64/string).
    #[wasm_bindgen(js_name = generateNodeKeypair)]
    pub fn wasm_generate_node_keypair() -> JsValue {
        let keypair = crypto::NodeKeypair::generate();

        let result = serde_json::json!({
            "privateKey": keypair.private_key_base64(),
            "publicKey": keypair.public_key_base64(),
            "claimCode": keypair.claim_code(),
        });

        serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
    }

    /// Derive claim code from a base64-encoded public key.
    #[wasm_bindgen(js_name = deriveClaimCode)]
    pub fn wasm_derive_claim_code(public_key_base64: &str) -> Result<String, JsError> {
        crypto::derive_claim_code_from_base64(public_key_base64)
            .map_err(|e| JsError::new(&e.to_string()))
    }

    /// Sign a message with a base64-encoded private key.
    ///
    /// Returns the signature as base64.
    #[wasm_bindgen(js_name = signMessage)]
    pub fn wasm_sign_message(private_key_base64: &str, message: &str) -> Result<String, JsError> {
        let keypair = crypto::keypair_from_base64(private_key_base64)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(keypair.sign_base64(message.as_bytes()))
    }

    /// Verify a signature.
    ///
    /// All inputs are base64-encoded (public key, signature) except message which is UTF-8.
    #[wasm_bindgen(js_name = verifySignature)]
    pub fn wasm_verify_signature(
        public_key_base64: &str,
        message: &str,
        signature_base64: &str,
    ) -> Result<bool, JsError> {
        match crypto::verify_signature_base64(
            public_key_base64,
            message.as_bytes(),
            signature_base64,
        ) {
            Ok(()) => Ok(true),
            Err(crypto::CryptoError::VerificationFailed) => Ok(false),
            Err(e) => Err(JsError::new(&e.to_string())),
        }
    }

    /// Build the message to sign for a node request.
    ///
    /// Format: `timestamp:method:path:sha256(body)`
    #[wasm_bindgen(js_name = buildSignMessage)]
    pub fn wasm_build_sign_message(timestamp: u64, method: &str, path: &str, body: &str) -> String {
        crypto::build_sign_message(timestamp, method, path, body.as_bytes())
    }

    /// Compute SHA256 hash of a string and return as hex.
    #[wasm_bindgen(js_name = sha256Hex)]
    pub fn wasm_sha256_hex(data: &str) -> String {
        crypto::sha256_hex(data.as_bytes())
    }
}

#[cfg(feature = "crypto")]
pub use crypto_wasm::*;

// Statistics WASM Bindings

/// Statistics result returned from computeStats.
#[wasm_bindgen(getter_with_clone)]
pub struct StatsResult {
    pub count: u32,
    pub mean: f64,
    #[wasm_bindgen(js_name = stdDev)]
    pub std_dev: f64,
    pub variance: f64,
    pub min: f64,
    pub max: f64,
    pub cv: f64,
}

/// Linear regression result.
#[wasm_bindgen(getter_with_clone)]
pub struct LinearRegressionResult {
    pub slope: f64,
    pub intercept: f64,
    #[wasm_bindgen(js_name = rSquared)]
    pub r_squared: f64,
}

/// Compute statistics for an array of numbers.
/// Returns an object with mean, stdDev, variance, min, max, count, cv.
#[wasm_bindgen(js_name = computeStats)]
pub fn wasm_compute_stats(values: Vec<f64>) -> StatsResult {
    let stats = crate::stats::Summary::new(values);
    StatsResult {
        count: stats.count() as u32,
        mean: stats.mean(),
        std_dev: stats.std_dev(),
        variance: stats.variance(),
        min: stats.min(),
        max: stats.max(),
        cv: stats.cv(),
    }
}

/// Compute percentile for an array of numbers.
/// p should be 0-100.
#[wasm_bindgen(js_name = computePercentile)]
pub fn wasm_compute_percentile(values: Vec<f64>, p: usize) -> f64 {
    let mut stats = crate::stats::Summary::new(values);
    stats.percentile(p)
}

/// Compute median for an array of numbers.
#[wasm_bindgen(js_name = computeMedian)]
pub fn wasm_compute_median(values: Vec<f64>) -> f64 {
    let mut stats = crate::stats::Summary::new(values);
    stats.median()
}

/// Compute interquartile range for an array of numbers.
#[wasm_bindgen(js_name = computeIqr)]
pub fn wasm_compute_iqr(values: Vec<f64>) -> f64 {
    let mut stats = crate::stats::Summary::new(values);
    stats.iqr()
}

/// Compute covariance between two arrays.
#[wasm_bindgen(js_name = computeCovariance)]
pub fn wasm_compute_covariance(x: Vec<f64>, y: Vec<f64>) -> f64 {
    crate::stats::covariance(&x, &y)
}

/// Compute Pearson correlation coefficient between two arrays.
#[wasm_bindgen(js_name = computeCorrelation)]
pub fn wasm_compute_correlation(x: Vec<f64>, y: Vec<f64>) -> f64 {
    crate::stats::correlation(&x, &y)
}

/// Compute linear regression. Returns { slope, intercept, rSquared } or null.
#[wasm_bindgen(js_name = computeLinearRegression)]
pub fn wasm_compute_linear_regression(x: Vec<f64>, y: Vec<f64>) -> Option<LinearRegressionResult> {
    crate::stats::linear_regression(&x, &y).map(|result| LinearRegressionResult {
        slope: result.slope,
        intercept: result.intercept,
        r_squared: result.r_squared,
    })
}

/// Compute exponential moving average with alpha smoothing factor.
#[wasm_bindgen(js_name = computeEma)]
pub fn wasm_compute_ema(data: Vec<f64>, alpha: f64) -> Vec<f64> {
    crate::stats::ema(&data, alpha)
}

/// Compute exponential moving average with span-based smoothing.
#[wasm_bindgen(js_name = computeEmaSpan)]
pub fn wasm_compute_ema_span(data: Vec<f64>, span: usize) -> Vec<f64> {
    crate::stats::ema_span(&data, span)
}

/// Compute simple moving average with window size.
#[wasm_bindgen(js_name = computeSma)]
pub fn wasm_compute_sma(data: Vec<f64>, window: usize) -> Vec<f64> {
    crate::stats::sma(&data, window)
}
