# Node Permissions Plan

## Problem

Nodes process jobs. Owner controls who can use their node:
- **Private**: Owner only
- **Shared**: Owner + specific users
- **Discord**: Owner + Discord server members
- **Public**: Anyone

Current `nodes_permissions` table is broken - no friends/guild system exists, queries on every request.

## Solution

Capability tokens with cryptographic verification. No DB query for permission checks.

Discord server membership verified via Bloom filters - compact, irreversible, no member lists stored.

---

## Database Schema

### Discord Server Filters

```sql
CREATE TABLE discord_server_filters (
    server_id text PRIMARY KEY,
    filter bytea NOT NULL,
    filter_hash text NOT NULL,
    member_count integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discord_filters_hash ON discord_server_filters(filter_hash);
```

### User Profiles (Discord Link)

```sql
ALTER TABLE user_profiles ADD COLUMN discord_id text UNIQUE;

CREATE INDEX idx_user_profiles_discord ON user_profiles(discord_id) WHERE discord_id IS NOT NULL;
```

### Permission Generation Counter

```sql
ALTER TABLE user_profiles ADD COLUMN permission_generation bigint NOT NULL DEFAULT 1;

CREATE FUNCTION increment_permission_generation(target_user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET permission_generation = permission_generation + 1
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Node Visibility

```sql
CREATE TYPE node_visibility AS ENUM ('private', 'shared', 'discord', 'public');

ALTER TABLE nodes
    ADD COLUMN visibility node_visibility NOT NULL DEFAULT 'private',
    ADD COLUMN allowed_users uuid[] NOT NULL DEFAULT '{}',
    ADD COLUMN discord_server_id text;

CREATE INDEX idx_nodes_discord_server ON nodes(discord_server_id) WHERE discord_server_id IS NOT NULL;

DROP TABLE nodes_permissions;
```

### Node Allowed Users Trigger

```sql
CREATE FUNCTION nodes_allowed_users_generation_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.allowed_users IS DISTINCT FROM NEW.allowed_users THEN
        PERFORM increment_permission_generation(NEW.user_id);

        PERFORM increment_permission_generation(unnest)
        FROM unnest(OLD.allowed_users)
        WHERE unnest IS NOT NULL;

        PERFORM increment_permission_generation(unnest)
        FROM unnest(NEW.allowed_users)
        WHERE unnest IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nodes_allowed_users_generation
    AFTER UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION nodes_allowed_users_generation_trigger();
```

---

## Discord Integration

### Bot Setup

1. Create Discord bot with `Server Members Intent`
2. Bot needs `View Members` permission when added to servers
3. Store bot token in environment: `DISCORD_BOT_TOKEN`

### Link Discord Flow

Portal account settings:
1. User clicks "Link Discord"
2. Triggers `supabase.auth.linkIdentity({ provider: 'discord', options: { scopes: 'identify guilds' } })`
3. On callback, extract Discord user ID from identity
4. Save to `user_profiles.discord_id`

### Bloom Filter Background Job

Runs every 5 minutes per server:

```typescript
async function refreshServerFilter(serverId: string): Promise<void> {
    const members = await discord.get(`/guilds/${serverId}/members?limit=1000`);
    const discordIds = members.map(m => m.user.id);

    const filter = createBloomFilter(discordIds, {
        falsePositiveRate: 0.01
    });

    await supabase.from('discord_server_filters').upsert({
        server_id: serverId,
        filter: filter.bytes,
        filter_hash: sha256(filter.bytes).slice(0, 16),
        member_count: discordIds.length,
        updated_at: new Date().toISOString()
    });

    // Member list discarded here - never stored
}
```

Filter sizing:
- 100 members @ 1% FP = ~120 bytes
- 1000 members @ 1% FP = ~1.2 KB
- 10000 members @ 1% FP = ~12 KB

### Server Selection UI

When user sets node visibility to "discord":
1. Query user's Discord servers via their linked token (not stored)
2. Query which servers have our bot: `SELECT server_id FROM discord_server_filters`
3. Show intersection as dropdown
4. Save selected `discord_server_id` to node

---

## Capability Token

### Structure

```typescript
interface CapabilityToken {
    version: 1;
    node_id: string;
    node_key: string;              // Node public key (base64)
    owner_id: string;
    visibility: 'private' | 'shared' | 'discord' | 'public';
    allowed_users: string[];       // For shared visibility
    discord_filter?: string;       // Base64 Bloom filter for discord visibility
    discord_filter_hash?: string;  // For cache validation
    iat: number;
    exp: number;
    gen: number;
    sig: string;
}
```

### Server Signing Keys

Environment variables:
```
SERVER_SIGNING_PRIVATE_KEY=base64...
SERVER_SIGNING_PUBLIC_KEY=base64...
```

Generate with Ed25519. Rotate annually.

### Canonical Serialization

Tokens signed using deterministic field order (NOT JSON.stringify):

```typescript
function serializeForSigning(token: Omit<CapabilityToken, 'sig'>): string {
    return [
        token.version,
        token.node_id,
        token.node_key,
        token.owner_id,
        token.visibility,
        token.allowed_users.sort().join(','),
        token.discord_filter ?? '',
        token.discord_filter_hash ?? '',
        token.iat,
        token.exp,
        token.gen
    ].join('\0');
}
```

### Token Issuance

**Endpoint: `POST /functions/v1/token-issue`**

Rate limit: 10 requests/minute per node.

1. Verify node signature (X-Node-Key, X-Node-Sig, X-Node-Ts)
2. Look up node by public_key
3. Reject if not claimed
4. Get owner's permission_generation
5. Build token based on visibility:
   - **private**: `allowed_users = [owner_id]`
   - **shared**: `allowed_users = [owner_id, ...node.allowed_users]`
   - **discord**: fetch Bloom filter from `discord_server_filters`
   - **public**: `allowed_users = []`
6. Serialize canonically, sign with Ed25519
7. Return token (1 hour TTL)

### Token Verification

```typescript
function verifyToken(
    token: CapabilityToken,
    requestNodeKey: string,
    jobOwnerDiscordId: string | null,
    currentGen: number
): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Expiry check
    if (now > token.exp) return false;

    // Node key must match token
    if (token.node_key !== requestNodeKey) return false;

    // Signature verification
    const payload = serializeForSigning(token);
    if (!ed25519.verify(decode(token.sig), encode(payload), SERVER_PUBLIC_KEY)) {
        return false;
    }

    // Generation check (stale token)
    if (token.gen < currentGen) return false;

    // Visibility-specific checks
    switch (token.visibility) {
        case 'public':
            return true;

        case 'private':
        case 'shared':
            return token.allowed_users.includes(jobOwnerId);

        case 'discord':
            if (!jobOwnerDiscordId || !token.discord_filter) return false;
            const filter = decodeBloomFilter(token.discord_filter);
            return filter.mightContain(jobOwnerDiscordId);
    }
}
```

Generation check: query `user_profiles.permission_generation`, cache 60s per user.

---

## Edge Functions

### New

| Function | Purpose |
|----------|---------|
| `token-issue` | Issue capability token |
| `discord-link-callback` | Handle Discord OAuth callback, save discord_id |

### Modified

| Function | Change |
|----------|--------|
| `chunk-claim` | Verify token, filter by visibility rules |
| `chunk-complete` | Verify token |
| `node-heartbeat` | Verify token |

### Shared

**`_shared/capability-token.ts`**
- `issueToken(node, owner)`
- `verifyToken(token, requestNodeKey, jobOwnerDiscordId, currentGen)`
- `serializeForSigning(token)`

**`_shared/bloom-filter.ts`**
- `createBloomFilter(items, options)`
- `decodeBloomFilter(base64)`
- `BloomFilter.mightContain(item)`

**`_shared/signing-keys.ts`**
- Load keypair from env
- `sign(payload)`
- `verify(signature, payload)`

---

## Node Crate

### Token Struct

```rust
#[derive(Serialize, Deserialize)]
struct CapabilityToken {
    version: u8,
    node_id: Uuid,
    node_key: String,
    owner_id: Uuid,
    visibility: Visibility,
    allowed_users: Vec<Uuid>,
    discord_filter: Option<String>,
    discord_filter_hash: Option<String>,
    iat: u64,
    exp: u64,
    gen: u64,
    sig: String,
}

impl CapabilityToken {
    fn is_expired(&self) -> bool;
    fn should_refresh(&self) -> bool;  // < 5 min remaining
}
```

### Storage

```
~/.config/wowlab-node/
    config.ini
    token.json
```

Token file permissions: 0600

### Request Headers

```
X-Node-Key: <public key base64>
X-Node-Sig: <signature base64>
X-Node-Ts: <timestamp>
Authorization: Bearer <token>
```

### Refresh Loop

```rust
async fn token_refresh_loop(auth: Arc<AuthContext>) {
    let mut backoff = Duration::from_secs(60);

    loop {
        sleep(backoff).await;

        if !auth.token().should_refresh() {
            backoff = Duration::from_secs(60);
            continue;
        }

        match auth.refresh_token().await {
            Ok(token) => {
                auth.store_token(token);
                backoff = Duration::from_secs(60);
            }
            Err(e) => {
                log::warn!("token refresh failed: {}", e);
                backoff = (backoff * 2).min(Duration::from_secs(300));

                if auth.token().is_expired() {
                    log::error!("token expired, pausing job claims");
                    auth.set_healthy(false);
                }
            }
        }
    }
}
```

---

## Portal

### Account Settings

**Link Discord section:**
- Shows "Link Discord" button if `discord_id` is null
- Shows linked Discord username + "Unlink" if linked
- Unlinking clears `discord_id`

### Node Settings

**Visibility selector:**
- Private (default)
- Shared with specific users
- Discord server members
- Public

**Shared visibility:**
- User search/picker to add allowed users
- Display list with remove buttons
- Saves to `nodes.allowed_users`

**Discord visibility:**
- Dropdown of user's Discord servers (where bot is present)
- "Bot not in server" state with invite link
- Requires Discord to be linked first
- Saves to `nodes.discord_server_id`

### Routes

- `/account/settings` - existing, add Link Discord section
- Node management - existing, update visibility UI

---

## Migration

1. Deploy database schema (new tables, columns)
2. Deploy Discord bot
3. Deploy background job for Bloom filter refresh
4. Deploy token-issue endpoint
5. Deploy updated edge functions
6. Deploy updated node binary
7. Drop nodes_permissions table (after rollout stable)

---

## Security

1. **Token theft**: 1-hour TTL mitigates. Token bound to node_key.
2. **Replay**: Request signatures have 5-minute window. Token replay limited by node_key binding.
3. **Key compromise**: Rotate server keys, all tokens invalidated.
4. **Generation overflow**: bigint lasts 292k years.
5. **Large Discord servers**: Bloom filter scales to 10k+ members in ~12KB.
6. **Bloom filter false positives**: 1% rate acceptable, slightly permissive.
7. **Discord member enumeration**: Impossible - Bloom filters are one-way.
8. **Rate limiting**: token-issue endpoint rate limited per node.
9. **Token size**: Bloom filters capped at reasonable size, large servers use filter_hash reference.
