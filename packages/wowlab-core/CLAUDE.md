# wowlab-core

Effect-TS domain library: schemas, entities, errors, constants.

## Module Structure

```
src/
  index.ts           # Public API: export * as Foo from "./Foo.js"
  Entities.ts        # Re-exports from internal/entities/
  Errors.ts          # Re-exports from internal/errors/
  Schemas.ts         # Re-exports from internal/schemas/
  internal/          # Implementation details
    entities/
    errors/
    schemas/
      dbc/           # DBC table schemas (preserve column order)
      Branded.ts     # Branded ID types
```

## Branded IDs

Dual pattern: Effect Schema for parsing + Brand for runtime construction.

```ts
// Both type and value with same name (requires eslint-disable no-redeclare)
export const SpellIDSchema = Schema.NumberFromString.pipe(
  Schema.int(),
  Schema.filter((n) => n === -1 || n >= 0),
  Schema.brand("SpellID"),
);

export type SpellID = Schema.Schema.Type<typeof SpellIDSchema>;

export const SpellID = Brand.refined<SpellID>(
  (n) => Number.isInteger(n) && (n === -1 || n >= 0),
  (n) => Brand.error(`Expected ${n} to be -1 or a non-negative integer`),
);
```

## Tagged Errors

Use `Data.TaggedError` with descriptive payload:

```ts
export class SpellNotFound extends Data.TaggedError("SpellNotFound")<{
  readonly unitId: Branded.UnitID;
  readonly spellId: number;
}> {}
```

Group related errors with union types:

```ts
export type RotationError =
  | NoChargesAvailable
  | SpellNotFound
  | SpellOnCooldown;
```

## Immutable Entities

Use immutable.js Record pattern:

```ts
interface UnitProps {
  readonly id: Branded.UnitID;
  readonly name: string;
  // ... all readonly
}

const UnitRecord = Record<UnitProps>({
  id: Branded.UnitID("unknown"),
  name: "Unknown",
  // ... defaults
});

export class Unit extends UnitRecord {
  static create(props: Partial<UnitProps>): Unit {
    return new Unit(props);
  }
}
```

## DBC Schemas

Files in `schemas/dbc/` map to game data tables. **Preserve CSV column order** - perfectionist sorting is disabled for these files.
