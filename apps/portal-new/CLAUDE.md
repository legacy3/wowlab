# apps/portal-new

Next.js 16 app. UI layer stripped - awaiting Park UI integration.

## Current State

- Data layer intact: Refine, Supabase, Zustand, React Query
- Routes simplified to plain text placeholders
- No UI components currently

## File Structure

```
src/
  app/           # Next.js routes (minimal placeholders)
  lib/           # Data layer, state, supabase, refine, routes
  providers/     # RefineProvider, DbcProvider
  styles/        # globals.css (minimal reset)
```
