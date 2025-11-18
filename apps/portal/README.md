# Portal App

Next.js 16 web application for WoW spell rotation simulation.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** shadcn/ui, TailwindCSS v4, Radix UI
- **State:** Jotai
- **Auth/DB:** Supabase
- **Library:** Effect-TS, Immutable.js

## Local Development

```bash
# From repository root
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from: Supabase Dashboard → Project Settings → API

## Deployment (Vercel)

### 1. Import from GitHub

In Vercel dashboard:

- **Framework Preset:** Next.js
- **Root Directory:** `apps/portal`

### 2. Add Environment Variables

Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Set for: Production, Preview, Development

### 3. Deploy

The `vercel.json` config handles the monorepo build automatically:

- Installs all workspace dependencies
- Builds internal packages first
- Builds Next.js app
- Deploys

## Architecture

See `CLAUDE.md` in repository root for:

- Component naming conventions
- State management patterns
- Page structure guidelines
- Effect-TS patterns
