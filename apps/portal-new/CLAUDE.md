# portal-new

Next.js 16 / React 19 app. Panda CSS + Park UI.

## Stack

- **Styling**: Panda CSS (not Tailwind) - recipes in `src/theme/recipes/`
- **Components**: Park UI in `src/components/ui/`
- **Data**: Refine + Supabase, React Query with persistence
- **State**: Zustand for editor, React Query for server state
- **Content**: MDX for docs/blog in `src/content/`

## Routes

```
/                    Home
/auth/sign-in        Auth
/blog                Blog index
/blog/[slug]         Blog post
/docs                Docs index
/docs/[...slug]      Doc page
/simulate            Simulation
/rotations           Rotation browser
/rotations/editor    New rotation
/rotations/editor/[id]  Edit rotation
/dev/ui              Component showcase
```

## State Hooks

```ts
// Game data (see game-data skill)
useSpell(id); // SpellDataFlat
useItem(id); // ItemDataFlat
useSpellSearch(); // Search spells
useItemSearch(); // Search items

// Editor
useEditor(); // Zustand store for rotation editor
useLoadRotation(id); // Load rotation from DB
useSaveRotation(); // Save rotation to DB

// UI
useUser(); // Auth state
useSidebar(); // Sidebar open/close
useTheme(); // Theme preference
```

## Structure

```
src/
  app/               Next.js routes
  components/
    ui/              Park UI components
    editor/          Rotation editor
    game/            GameIcon, tooltips
    layout/          Shell, navbar, sidebar
    content/         MDX components
  lib/
    state/           Zustand stores, React Query hooks
    dbc/             DBC fetcher, batcher, Effect layer
    refine/          Data provider, auth, resources
    supabase/        Client setup
  theme/
    recipes/         Component styles (Panda CSS)
    tokens/          Design tokens
  content/           MDX files (docs, blog)
  providers/         React context providers
```

## Skills

- **game-data** - How spell/item data works. Read before touching game data.
- **park-ui** - Component patterns. Check before adding UI.
