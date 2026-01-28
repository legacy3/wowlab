# Supabase

Edge functions and database configuration for WoW Lab.

## Do I need this?

Most contributors can skip this directory entirely.

**Working on the portal?** Use the live database. Copy `apps/portal/.env.example` to `.env.local` and you're set.

**Working on the simulation engine?** It's pure Rust with no Supabase dependency. Just run `cargo build` in `crates/engine`.

**Working on edge functions or database schema?** Then this is for you.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for schema operations)

## Edge Functions

Deploy functions to the linked project:

```bash
./supabase/functions/deploy_all.sh   # deploy all functions
./supabase/functions/check_all.sh    # type-check all functions
supabase functions deploy icons      # deploy one
```

Functions: `icons`, `talent-atlas`. Each has its own `deno.json` for dependency isolation. JWT verification settings live in `config.toml`.

## Database Schema

Pull the current schema into a migration file:

```bash
supabase db pull
```

Push local migrations to the remote database:

```bash
supabase db push
```

## Self-Hosting

If you want to run your own instance, export the schema and seed data:

```bash
supabase db pull
supabase db dump --data-only --table fight_profiles -f seeds/fight_profiles.sql
supabase db dump --data-only --table reserved_handles -f seeds/reserved_handles.sql
```

Only `fight_profiles` and `reserved_handles` need seeding. Everything else is user-generated.

Then follow the [Supabase self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker) to spin up your own stack.
