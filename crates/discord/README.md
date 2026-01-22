# wowlab-discord

Official WoW Lab Discord bot. Provides community commands and enables Discord-based node permissions (server members can use nodes shared with their server).

**You don't need to run this** - we host it. Just add it to your server.

[Add to server](https://wowlab.gg/go/discord-bot) | [Join community](https://wowlab.gg/go/discord)

## Commands

- `/wlab ping` - Latency
- `/wlab about` - Bot info
- `/wlab help` - Command list
- `/wlab server` - Server info
- `/wlab members` - Member count

## Contributing

```bash
cp .env.example .env  # Add DISCORD_TOKEN
cargo run -p wowlab-discord
```

## Docker

```bash
docker run -e DISCORD_TOKEN=... ghcr.io/legacy3/wowlab-discord
```
