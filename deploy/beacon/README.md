# WowLab Beacon (Centrifugo)

Multi-region realtime server on Fly.io with Upstash Redis.

## Quick Deploy

```bash
# 1. Create the app (run from this directory)
fly apps create wowlab-beacon

# 2. Create Upstash Redis (interactive - pick primary region: lhr)
fly redis create

# 3. Get your Redis URL
fly redis list
fly redis status <your-redis-name>

# 4. Set secrets (replace values!)
fly secrets set \
  CENTRIFUGO_TOKEN_SECRET="$(openssl rand -hex 32)" \
  CENTRIFUGO_API_KEY="$(openssl rand -hex 32)" \
  CENTRIFUGO_ADMIN_PASSWORD="$(openssl rand -hex 16)" \
  CENTRIFUGO_ADMIN_SECRET="$(openssl rand -hex 32)" \
  CENTRIFUGO_ENGINE__REDIS__ADDRESS="redis://default:YOUR_PASSWORD@YOUR_REDIS_HOST:6379"

# 5. Deploy
fly deploy

# 6. Scale to multiple regions
fly scale count 4 --region lhr,iad,sin,syd

# 7. Add Redis replicas in same regions (for low latency)
fly redis update <your-redis-name> --region iad
fly redis update <your-redis-name> --region sin
fly redis update <your-redis-name> --region syd
```

## Verify Deployment

```bash
# Check status
fly status

# View logs
fly logs

# Open admin UI
fly open
# Login with your CENTRIFUGO_ADMIN_PASSWORD
```

## Architecture

```
User (EU) ──► Fly Edge ──► Centrifugo LHR ──► Redis LHR primary
User (US) ──► Fly Edge ──► Centrifugo IAD ──► Redis IAD replica
User (Asia) ─► Fly Edge ──► Centrifugo SIN ──► Redis SIN replica
```

## Integration with Supabase

### Generate JWT tokens (in your Supabase Edge Function):

```typescript
import * as jwt from "jsonwebtoken";

const token = jwt.sign(
  { sub: user.id },
  Deno.env.get("CENTRIFUGO_TOKEN_SECRET"),
  { expiresIn: "24h" },
);
```

### Publish from backend:

```typescript
await fetch("https://beacon.wowlab.gg/api/publish", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": Deno.env.get("CENTRIFUGO_API_KEY"),
  },
  body: JSON.stringify({
    channel: "updates",
    data: { message: "Hello!" },
  }),
});
```

### Client connection (JS):

```javascript
import { Centrifuge } from "centrifuge";

const client = new Centrifuge("wss://beacon.wowlab.gg/connection/websocket", {
  token: "YOUR_JWT_TOKEN",
});

client.on("connected", () => console.log("Connected!"));

const sub = client.newSubscription("updates");
sub.on("publication", (ctx) => console.log("Received:", ctx.data));
sub.subscribe();

client.connect();
```

## Costs

- Fly.io: ~$3-4/region/month (shared-cpu-1x, 512MB)
- Upstash Redis: Free tier or ~$10-50/month depending on usage
- Total: ~$15-30/month for 4 regions
