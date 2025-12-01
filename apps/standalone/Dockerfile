# WowLab Simulation Daemon
#
# BUILD (from repo root):
#   docker build -f apps/standalone/Dockerfile -t wowlab-daemon .
#
# RUN:
#   docker run -p 3847:3847 wowlab-daemon
#
# With custom port:
#   docker run -p 8080:8080 wowlab-daemon daemon --port 8080
#
# Override Supabase credentials (optional):
#   docker run -p 3847:3847 \
#     -e SUPABASE_URL=https://your-project.supabase.co \
#     -e SUPABASE_ANON_KEY=your-key \
#     wowlab-daemon

FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps

# Copy workspace root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files for workspace packages
COPY packages/wowlab-core/package.json ./packages/wowlab-core/
COPY packages/wowlab-services/package.json ./packages/wowlab-services/
COPY packages/wowlab-rotation/package.json ./packages/wowlab-rotation/
COPY packages/wowlab-runtime/package.json ./packages/wowlab-runtime/
COPY apps/standalone/package.json ./apps/standalone/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build

# Copy source files
COPY packages/wowlab-core ./packages/wowlab-core
COPY packages/wowlab-services ./packages/wowlab-services
COPY packages/wowlab-rotation ./packages/wowlab-rotation
COPY packages/wowlab-runtime ./packages/wowlab-runtime
COPY apps/standalone ./apps/standalone
COPY tsconfig.json ./

# Build packages and standalone app
RUN pnpm --filter @wowlab/core build && \
    pnpm --filter @wowlab/services build && \
    pnpm --filter @wowlab/rotation build && \
    pnpm --filter @wowlab/runtime build && \
    pnpm --filter @apps/standalone build

# ---- Production ----
FROM base AS production

WORKDIR /app

# Copy built artifacts and node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/standalone ./apps/standalone

WORKDIR /app/apps/standalone

# Expose daemon port
EXPOSE 3847

ENV NODE_ENV=production

# Run the daemon (uses baked-in Supabase credentials by default)
CMD ["node", "--import", "tsx", "src/index.ts", "daemon", "--host", "0.0.0.0", "--port", "3847"]
