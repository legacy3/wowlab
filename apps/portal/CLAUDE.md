# portal

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

Next.js 16 / React 19 app. Panda CSS + Park UI. Intlayer for i18n (en + de).

## Stack

- **Styling**: Panda CSS (not Tailwind) - recipes in `src/theme/recipes/`
- **Components**: Park UI in `src/components/ui/`
- **Data**: Supabase + React Query with persistence
- **State**: Zustand for editor/UI, React Query for server state
- **Content**: MDX for docs/blog via Velite in `src/content/`
- **i18n**: Intlayer with `[locale]` route prefix (en default, de)

## Routes

```
/                        Home
/about                   About
/account                 User account
/auth/sign-in            Auth
/auth/callback           OAuth callback
/blog                    Blog index
/blog/[slug]             Blog post
/computing               Distributed computing
/dev/docs                Docs index
/dev/docs/[...slug]      Doc page
/dev/engine              Engine playground
/dev/hooks               Hooks showcase
/dev/metrics             Metrics dashboard
/dev/ui                  Component showcase
/plan                    Planning
/plan/traits             Trait editor
/rotations               Rotation browser
/rotations/browse        Browse with modal interception
/rotations/editor        New rotation
/rotations/editor/[id]   Edit rotation
/simulate                Simulation
/users                   User profiles
```

## Structure

```
src/
  app/[locale]/      Next.js routes (locale-prefixed)
  components/
    ui/              Park UI components
    editor/          Rotation editor
    game/            GameIcon, tooltips
    layout/          Shell, navbar, sidebar
    content/         MDX components
    computing/       Distributed computing UI
    plan/            Planning UI
    fabric/          Fabric.js canvas editor
    auth/            Auth components
    account/         Account components
    rotations/       Rotation browser UI
    simulate/        Simulation UI
    users/           User profile components
  lib/
    state/           Zustand stores, React Query hooks
    engine/          WASM engine integration
    supabase/        Client setup
    content/         MDX fetcher & processing
    routing/         Locale routing utilities
    sim/             Simulation helpers
    trait/           Trait logic
  theme/
    recipes/         Component styles (Panda CSS)
    tokens/          Design tokens
  content/           MDX files (docs, blog)
  providers/         React context providers
  i18n/              Intlayer content declarations
```

## Skills

- **code-style** - Code style and formatting rules.
- **exports** - Barrel files, module exports.
- **game-data** - How spell/item data works. Read before touching game data.
- **loading-states** - Flask loaders, loading indicators.
- **park-ui** - Component patterns. Check before adding UI.
- **portal-component** - Patterns for new pages/components.
- **state-management** - React Query, Zustand, domain modules.
