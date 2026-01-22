# Node Authentication Refactor

## Problem

Current system uses node UUID as the only credential. No signatures, no crypto. Anyone who learns a nodeId can impersonate the node.

## Solution

Ed25519 keypair per node. Public key = identity. All requests signed. Claim code derived from pubkey fingerprint.

---

## Mechanism

- Keypair = node identity
- Public key registered with server
- Claim code = fingerprint of pubkey (derived on registration, stored for lookup)
- All requests signed with private key
- Claiming = linking pubkey to user

**Entry point 1 (node-first):**
1. Node generates keypair → saves private key to config
2. Node registers → sends pubkey → server creates node record (user_id=null)
3. Node displays claim code (derived from pubkey)
4. User enters claim code in portal → server finds node by derived code → sets user_id

**Entry point 2 (portal-first):**
1. User clicks "Add Node" in portal
2. Portal generates keypair via WASM (same Rust code)
3. Server creates node record with pubkey + user_id=current user (already claimed)
4. User downloads config containing private key
5. Node starts → registers → server finds existing node, already claimed

Same underlying system. Keypair generated in Rust, either native (node) or WASM (portal).

---

## Database Changes

```sql
ALTER TABLE nodes
  ADD COLUMN public_key text UNIQUE;

CREATE INDEX idx_nodes_public_key ON nodes(public_key) WHERE public_key IS NOT NULL;

-- claim_code column stays but is now derived from pubkey on insert (not random)
-- already indexed for lookup
```

---

## Signature Scheme

**Signed message:**
```
timestamp\0method\0path\0body_hash
```

- `timestamp`: Unix seconds (±30s tolerance)
- `method`: HTTP method
- `path`: e.g., `/functions/v1/node-heartbeat`
- `body_hash`: SHA256 of request body (hex)
- Uses null byte (`\0`) separator to avoid conflicts with path characters

**Request headers:**
```
X-Node-Key: <base64 public key>
X-Node-Sig: <base64 signature>
X-Node-Ts: <unix timestamp>
```

---

## Crate Structure

No changes. Crypto goes in `parsers` - it already does encoding/decoding and has WASM bindings.

```
crates/
  parsers/
    src/
      crypto.rs   # NEW - keypair gen, signing, claim code derivation
      lib.rs      # Add wasm_bindgen exports for crypto
```

Pattern matches existing code:
- `encode_trait_loadout` / `decode_trait_loadout` → `derive_claim_code` / `verify_signature`
- Uses existing WASM infrastructure
- No new crate needed

---

## Files Changed

### Database
- `supabase/migrations/XXXXXX_node_auth.sql` - add public_key column

### Parsers crate (crypto module)
- `crates/parsers/Cargo.toml` - add ed25519-dalek, sha2 deps
- `crates/parsers/src/crypto.rs` - NEW: keypair gen, signing, claim code derivation
- `crates/parsers/src/lib.rs` - add crypto module, wasm_bindgen exports

### Node crate
- `crates/node/Cargo.toml` - already depends on parsers
- `crates/node/src/config.rs` - store private_key instead of node_id
- `crates/node/src/core.rs` - use keypair identity
- `crates/node/src/claim.rs` - use parsers::crypto for claim code
- `crates/node/src/supabase/client.rs` - sign all requests using parsers::crypto

### Edge functions
- `supabase/functions/_shared/verify.ts` - NEW: signature verification
- `supabase/functions/node-register/index.ts` - verify sig, lookup/create by pubkey
- `supabase/functions/node-heartbeat/index.ts` - verify sig
- `supabase/functions/chunk-claim/index.ts` - verify sig
- `supabase/functions/chunk-complete/index.ts` - verify sig

### Portal
- Node management page - add "Create Node" flow using wowlab-parsers WASM crypto

---

## Register Endpoint Logic

```
receive signed request with pubkey

verify signature

if node with pubkey exists:
  return { id, claimed: user_id != null }
else:
  create node with pubkey, user_id = null
  return { id, claimed: false }
```

---

## Claim Endpoint Logic

```
receive claim_code from user

lookup node by claim_code (indexed column)

set user_id = current user
```

Claim code is derived from pubkey on registration and stored for indexed lookup.

---

## Migration

1. Deploy database migration
2. Deploy new edge functions (require signatures)
3. Deploy new node binaries
4. Old nodes break, users update
