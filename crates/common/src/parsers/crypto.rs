//! Cryptographic utilities for node authentication.
//!
//! Provides Ed25519 key generation, signing, and verification for the node
//! authentication system. The same code runs natively (node binary) and in
//! WASM (portal for node creation).

use data_encoding::BASE32_NOPAD;
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use sha2::{Digest, Sha256};
use thiserror::Error;

/// Length of claim codes (characters).
const CLAIM_CODE_LENGTH: usize = 8;

/// Errors from crypto operations.
#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("invalid private key length: expected 32 bytes, got {0}")]
    InvalidPrivateKeyLength(usize),

    #[error("invalid public key length: expected 32 bytes, got {0}")]
    InvalidPublicKeyLength(usize),

    #[error("invalid public key")]
    InvalidPublicKey,

    #[error("invalid signature length: expected 64 bytes, got {0}")]
    InvalidSignatureLength(usize),

    #[error("invalid signature")]
    InvalidSignature,

    #[error("signature verification failed")]
    VerificationFailed,
}

/// A node keypair for authentication.
#[derive(Clone)]
pub struct NodeKeypair {
    signing_key: SigningKey,
}

impl NodeKeypair {
    /// Generate a new random keypair.
    pub fn generate() -> Self {
        use rand::RngCore;
        let mut key_bytes = [0u8; 32];
        rand::rng().fill_bytes(&mut key_bytes);
        let signing_key = SigningKey::from_bytes(&key_bytes);
        Self { signing_key }
    }

    /// Create a keypair from a private key (32 bytes).
    pub fn from_private_key(bytes: &[u8]) -> Result<Self, CryptoError> {
        if bytes.len() != 32 {
            return Err(CryptoError::InvalidPrivateKeyLength(bytes.len()));
        }
        let mut key_bytes = [0u8; 32];
        key_bytes.copy_from_slice(bytes);
        let signing_key = SigningKey::from_bytes(&key_bytes);
        Ok(Self { signing_key })
    }

    /// Get the private key bytes (32 bytes).
    pub fn private_key_bytes(&self) -> [u8; 32] {
        self.signing_key.to_bytes()
    }

    /// Get the public key bytes (32 bytes).
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing_key.verifying_key().to_bytes()
    }

    /// Get the private key as base64.
    pub fn private_key_base64(&self) -> String {
        data_encoding::BASE64.encode(&self.private_key_bytes())
    }

    /// Get the public key as base64.
    pub fn public_key_base64(&self) -> String {
        data_encoding::BASE64.encode(&self.public_key_bytes())
    }

    /// Derive the claim code from this keypair's public key.
    pub fn claim_code(&self) -> String {
        derive_claim_code(&self.public_key_bytes())
    }

    /// Sign a message.
    pub fn sign(&self, message: &[u8]) -> [u8; 64] {
        self.signing_key.sign(message).to_bytes()
    }

    /// Sign a message and return base64 signature.
    pub fn sign_base64(&self, message: &[u8]) -> String {
        data_encoding::BASE64.encode(&self.sign(message))
    }
}

/// Create a keypair from base64-encoded private key.
pub fn keypair_from_base64(private_key_base64: &str) -> Result<NodeKeypair, CryptoError> {
    let bytes = data_encoding::BASE64
        .decode(private_key_base64.as_bytes())
        .map_err(|_| CryptoError::InvalidPrivateKeyLength(0))?;
    NodeKeypair::from_private_key(&bytes)
}

/// Derive a claim code from a public key.
///
/// The claim code is the first N characters of the base32-encoded SHA256 hash
/// of the public key. This gives a human-readable code that's easy to type.
pub fn derive_claim_code(public_key: &[u8]) -> String {
    let hash = Sha256::digest(public_key);
    let encoded = BASE32_NOPAD.encode(&hash);
    encoded[..CLAIM_CODE_LENGTH].to_uppercase()
}

/// Derive a claim code from a base64-encoded public key.
pub fn derive_claim_code_from_base64(public_key_base64: &str) -> Result<String, CryptoError> {
    let bytes = data_encoding::BASE64
        .decode(public_key_base64.as_bytes())
        .map_err(|_| CryptoError::InvalidPublicKeyLength(0))?;
    if bytes.len() != 32 {
        return Err(CryptoError::InvalidPublicKeyLength(bytes.len()));
    }
    Ok(derive_claim_code(&bytes))
}

/// Verify a signature against a public key.
pub fn verify_signature(
    public_key: &[u8],
    message: &[u8],
    signature: &[u8],
) -> Result<(), CryptoError> {
    if public_key.len() != 32 {
        return Err(CryptoError::InvalidPublicKeyLength(public_key.len()));
    }
    if signature.len() != 64 {
        return Err(CryptoError::InvalidSignatureLength(signature.len()));
    }

    let mut pk_bytes = [0u8; 32];
    pk_bytes.copy_from_slice(public_key);
    let verifying_key =
        VerifyingKey::from_bytes(&pk_bytes).map_err(|_| CryptoError::InvalidPublicKey)?;

    let mut sig_bytes = [0u8; 64];
    sig_bytes.copy_from_slice(signature);
    let sig = Signature::from_bytes(&sig_bytes);

    verifying_key
        .verify(message, &sig)
        .map_err(|_| CryptoError::VerificationFailed)
}

/// Verify a signature using base64-encoded inputs.
pub fn verify_signature_base64(
    public_key_base64: &str,
    message: &[u8],
    signature_base64: &str,
) -> Result<(), CryptoError> {
    let public_key = data_encoding::BASE64
        .decode(public_key_base64.as_bytes())
        .map_err(|_| CryptoError::InvalidPublicKeyLength(0))?;
    let signature = data_encoding::BASE64
        .decode(signature_base64.as_bytes())
        .map_err(|_| CryptoError::InvalidSignatureLength(0))?;
    verify_signature(&public_key, message, &signature)
}

/// Compute SHA256 hash of data and return as hex string.
pub fn sha256_hex(data: &[u8]) -> String {
    let hash = Sha256::digest(data);
    data_encoding::HEXLOWER.encode(&hash)
}

/// Build the message to sign for a node request.
///
/// Format: `timestamp\0method\0path\0body_hash`
pub fn build_sign_message(timestamp: u64, method: &str, path: &str, body: &[u8]) -> String {
    let body_hash = sha256_hex(body);
    format!("{timestamp}\0{method}\0{path}\0{body_hash}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let kp1 = NodeKeypair::generate();
        let kp2 = NodeKeypair::generate();

        // Keys should be different
        assert_ne!(kp1.private_key_bytes(), kp2.private_key_bytes());
        assert_ne!(kp1.public_key_bytes(), kp2.public_key_bytes());

        // Keys should be correct length
        assert_eq!(kp1.private_key_bytes().len(), 32);
        assert_eq!(kp1.public_key_bytes().len(), 32);
    }

    #[test]
    fn test_keypair_from_private_key() {
        let original = NodeKeypair::generate();
        let restored = NodeKeypair::from_private_key(&original.private_key_bytes()).unwrap();

        assert_eq!(original.private_key_bytes(), restored.private_key_bytes());
        assert_eq!(original.public_key_bytes(), restored.public_key_bytes());
    }

    #[test]
    fn test_keypair_from_base64() {
        let original = NodeKeypair::generate();
        let restored = keypair_from_base64(&original.private_key_base64()).unwrap();

        assert_eq!(original.private_key_bytes(), restored.private_key_bytes());
        assert_eq!(original.public_key_bytes(), restored.public_key_bytes());
    }

    #[test]
    fn test_claim_code_derivation() {
        let kp = NodeKeypair::generate();
        let code = kp.claim_code();

        // Claim code should be uppercase alphanumeric
        assert_eq!(code.len(), CLAIM_CODE_LENGTH);
        assert!(code
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()));

        // Same keypair should produce same code
        assert_eq!(code, kp.claim_code());

        // Derive from base64 should match
        let code_from_base64 = derive_claim_code_from_base64(&kp.public_key_base64()).unwrap();
        assert_eq!(code, code_from_base64);
    }

    #[test]
    fn test_claim_code_uniqueness() {
        let kp1 = NodeKeypair::generate();
        let kp2 = NodeKeypair::generate();

        // Different keys should (almost certainly) produce different codes
        assert_ne!(kp1.claim_code(), kp2.claim_code());
    }

    #[test]
    fn test_sign_and_verify() {
        let kp = NodeKeypair::generate();
        let message = b"test message to sign";

        let signature = kp.sign(message);

        // Verification should succeed
        verify_signature(&kp.public_key_bytes(), message, &signature).unwrap();
    }

    #[test]
    fn test_sign_and_verify_base64() {
        let kp = NodeKeypair::generate();
        let message = b"test message to sign";

        let signature = kp.sign_base64(message);

        // Verification should succeed
        verify_signature_base64(&kp.public_key_base64(), message, &signature).unwrap();
    }

    #[test]
    fn test_verify_wrong_message() {
        let kp = NodeKeypair::generate();
        let message = b"original message";
        let wrong_message = b"different message";

        let signature = kp.sign(message);

        // Verification with wrong message should fail
        let result = verify_signature(&kp.public_key_bytes(), wrong_message, &signature);
        assert!(matches!(result, Err(CryptoError::VerificationFailed)));
    }

    #[test]
    fn test_verify_wrong_key() {
        let kp1 = NodeKeypair::generate();
        let kp2 = NodeKeypair::generate();
        let message = b"test message";

        let signature = kp1.sign(message);

        // Verification with wrong key should fail
        let result = verify_signature(&kp2.public_key_bytes(), message, &signature);
        assert!(matches!(result, Err(CryptoError::VerificationFailed)));
    }

    #[test]
    fn test_verify_tampered_signature() {
        let kp = NodeKeypair::generate();
        let message = b"test message";

        let mut signature = kp.sign(message);
        signature[0] ^= 0xFF; // Tamper with first byte

        // Verification should fail
        let result = verify_signature(&kp.public_key_bytes(), message, &signature);
        assert!(result.is_err());
    }

    #[test]
    fn test_sha256_hex() {
        let data = b"hello world";
        let hash = sha256_hex(data);

        // Known SHA256 hash of "hello world"
        assert_eq!(
            hash,
            "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        );
    }

    #[test]
    fn test_build_sign_message() {
        let timestamp = 1234567890u64;
        let method = "POST";
        let path = "/functions/v1/node-heartbeat";
        let body = b"{}";

        let message = build_sign_message(timestamp, method, path, body);

        // Should contain all parts separated by null bytes
        let parts: Vec<&str> = message.split('\0').collect();
        assert_eq!(parts.len(), 4);
        assert_eq!(parts[0], "1234567890");
        assert_eq!(parts[1], "POST");
        assert_eq!(parts[2], "/functions/v1/node-heartbeat");
        assert_eq!(parts[3], sha256_hex(body));
    }

    #[test]
    fn test_full_signing_flow() {
        let kp = NodeKeypair::generate();

        // Build request message
        let timestamp = 1700000000u64;
        let method = "POST";
        let path = "/functions/v1/chunk-claim";
        let body = br#"{"batchSize":5}"#;

        let message = build_sign_message(timestamp, method, path, body);

        // Sign
        let signature = kp.sign_base64(message.as_bytes());

        // Verify
        verify_signature_base64(&kp.public_key_base64(), message.as_bytes(), &signature).unwrap();
    }

    #[test]
    fn test_invalid_key_lengths() {
        // Too short private key
        let result = NodeKeypair::from_private_key(&[0u8; 16]);
        assert!(matches!(
            result,
            Err(CryptoError::InvalidPrivateKeyLength(16))
        ));

        // Too long private key
        let result = NodeKeypair::from_private_key(&[0u8; 64]);
        assert!(matches!(
            result,
            Err(CryptoError::InvalidPrivateKeyLength(64))
        ));

        // Invalid public key length for verification
        let result = verify_signature(&[0u8; 16], b"msg", &[0u8; 64]);
        assert!(matches!(
            result,
            Err(CryptoError::InvalidPublicKeyLength(16))
        ));

        // Invalid signature length
        let kp = NodeKeypair::generate();
        let result = verify_signature(&kp.public_key_bytes(), b"msg", &[0u8; 32]);
        assert!(matches!(
            result,
            Err(CryptoError::InvalidSignatureLength(32))
        ));
    }
}
