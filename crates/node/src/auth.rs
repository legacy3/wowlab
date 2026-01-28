use crate::sentinel::SignedHeaders;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use directories::ProjectDirs;
use ed25519_dalek::{Signer, SigningKey};
use sha2::{Digest, Sha256};
use std::path::PathBuf;

/// Ed25519 keypair for node authentication.
#[derive(Clone)]
pub struct NodeKeypair {
    signing_key: SigningKey,
    /// Base64-encoded public key (sent as X-Node-Key header).
    pub public_key_b64: String,
}

impl NodeKeypair {
    /// Load existing keypair or generate a new one.
    pub fn load_or_create() -> Self {
        let path = Self::keypair_path();

        if let Some(ref path) = path {
            if path.exists() {
                if let Ok(bytes) = std::fs::read(path) {
                    if bytes.len() == 32 {
                        let key_bytes: [u8; 32] = bytes.try_into().unwrap();
                        let signing_key = SigningKey::from_bytes(&key_bytes);
                        let verifying_key = signing_key.verifying_key();
                        let public_key_b64 = BASE64.encode(verifying_key.as_bytes());
                        tracing::debug!("Loaded keypair from {:?}", path);
                        return Self {
                            signing_key,
                            public_key_b64,
                        };
                    }
                }
                tracing::warn!("Invalid keypair file, regenerating");
            }
        }

        // Generate new keypair
        use rand::RngCore;
        let mut key_bytes = [0u8; 32];
        rand::rng().fill_bytes(&mut key_bytes);
        let signing_key = SigningKey::from_bytes(&key_bytes);
        let verifying_key = signing_key.verifying_key();
        let public_key_b64 = BASE64.encode(verifying_key.as_bytes());

        // Save private key bytes
        if let Some(ref path) = path {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            if let Err(e) = std::fs::write(path, signing_key.to_bytes()) {
                tracing::error!("Failed to save keypair: {}", e);
            } else {
                // Set restrictive permissions on Unix
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
                }
                tracing::info!("Generated new keypair at {:?}", path);
            }
        }

        Self {
            signing_key,
            public_key_b64,
        }
    }

    /// Sign a request, returning the auth headers (key, signature, timestamp).
    fn sign(&self, method: &str, path: &str, body: &[u8]) -> SignedHeaders {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let body_hash = hex::encode(Sha256::digest(body));
        let message = format!("{}\0{}\0{}\0{}", timestamp, method, path, body_hash);

        let signature = self.signing_key.sign(message.as_bytes());
        let sig_b64 = BASE64.encode(signature.to_bytes());

        SignedHeaders {
            key: self.public_key_b64.clone(),
            signature: sig_b64,
            timestamp: timestamp.to_string(),
        }
    }

    fn keypair_path() -> Option<PathBuf> {
        ProjectDirs::from("gg", "wowlab", "wowlab-node")
            .map(|dirs| dirs.config_dir().join("keypair"))
    }

    /// Delete the stored keypair file.
    pub fn delete() -> bool {
        match Self::keypair_path() {
            Some(path) => std::fs::remove_file(&path).is_ok(),
            None => false,
        }
    }
}

impl crate::sentinel::RequestSigner for NodeKeypair {
    fn sign_request(&self, method: &str, path: &str, body: &[u8]) -> SignedHeaders {
        self.sign(method, path, body)
    }
}
