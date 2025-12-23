# wowlab-services

Effect-TS service layer with dependency injection via Layers.

## Module Structure

```
src/
  index.ts           # Public API: export * as Foo from "./Foo.js"
  Data.ts            # Re-exports data services
  State.ts           # Re-exports state services
  internal/
    data/            # Data fetching services
    state/           # State management
    talents/         # Talent tree logic
```

## Service Pattern

Define interface + Context.Tag in same file:

```ts
// Interface defines the contract
export interface SpellInfoService {
  readonly getSpellInfo: (
    id: Schemas.Branded.SpellID,
  ) => Effect.Effect<Entities.Spell.SpellInfo, Errors.SpellInfoNotFound>;
}

// Tag for dependency injection (requires eslint-disable no-redeclare)
export const SpellInfoService = Context.GenericTag<SpellInfoService>(
  "@wowlab/services/SpellInfoService",
);
```

Or use the class-based Tag pattern:

```ts
export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}
```

## Layer Implementation

Use `Layer.effect` with `Effect.gen`:

```ts
export const DbcServiceLive: Layer.Layer<DbcService, never, DbcBatchFetcher> =
  Layer.effect(
    DbcService,
    Effect.gen(function* () {
      const fetcher = yield* DbcBatchFetcher;

      return {
        getById: (table, id) =>
          Effect.request(new GetDbcById({ id, table }), resolvers.byId),
        // ...
      } satisfies DbcServiceInterface;
    }),
  );
```

## Key Conventions

- **No async/await**: Use `Effect.gen` with `yield*`
- **Prefer `satisfies`**: For type checking return values
- **Errors in type signature**: `Effect.Effect<Success, Error, Requirements>`
- **Tag naming**: `@wowlab/services/ServiceName`

## Testing

Tests live in `__tests__/` directories using vitest.
