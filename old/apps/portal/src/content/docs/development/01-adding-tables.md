---
title: Adding DBC Tables
description: How to add a new DBC table to the system
updatedAt: 2025-12-18
---

# Adding DBC Tables

Adding a new DBC table requires just three files. The registry handles everything else.

## 1. Create the schema

Add a schema file in `packages/wowlab-core/src/internal/schemas/dbc/`:

```typescript
// MyNewTableSchema.ts
import * as Schema from "effect/Schema";

export const MyNewTableRowSchema = Schema.Struct({
  ID: Schema.Number,
  Name_lang: Schema.String,
  SomeFK: Schema.Number,
  // ... match columns from the CSV
});

export type MyNewTableRow = typeof MyNewTableRowSchema.Type;
```

Export it from the index:

```typescript
// index.ts
export * from "./MyNewTableSchema.js";
```

## 2. Register the table

Add one entry to `DBC_TABLES` in `packages/wowlab-core/src/DbcTableRegistry.ts`:

```typescript
export const DBC_TABLES = {
  // ... existing tables
  myNewTable: {
    file: "MyNewTable.csv",
    schema: Dbc.MyNewTableRowSchema,
    tableName: "my_new_table",
  },
} as const;
```

## 3. Upload to Supabase

```bash
pnpm build # Rebuild packages
pnpm cli upload-dbc --tables myNewTable
```

Done. The table is now available everywhere.

## Using the table

```typescript
// Lookup by ID
const row = yield * dbcService.getById("my_new_table", 123);

// Lookup by foreign key (single result)
const row = yield * dbcService.getOneByFk("my_new_table", "SomeFK", 456);

// Lookup by foreign key (multiple results)
const rows = yield * dbcService.getManyByFk("my_new_table", "ParentID", 789);

// Batch lookup
const rows = yield * dbcService.getManyByIds("my_new_table", [1, 2, 3]);
```

## Type safety

Table names autocomplete and typos fail at compile time:

```typescript
dbcService.getById("my_new_table", 123); // OK
dbcService.getById("my_nwe_table", 123); // Type error
```

Return types are inferred from the schema:

```typescript
const row = yield * dbcService.getById("my_new_table", 123);
// row: MyNewTableRow | undefined
```

## Available methods

| Method                                 | Use case                     |
| -------------------------------------- | ---------------------------- |
| `getById(table, id)`                   | Lookup by `ID` column        |
| `getManyByIds(table, ids)`             | Batch lookup by `ID`         |
| `getOneByFk(table, fk, value)`         | Single row by foreign key    |
| `getManyByFk(table, fk, value)`        | Multiple rows by foreign key |
| `getManyByFkValues(table, fk, values)` | Batch FK lookup              |
| `getAll(table)`                        | Full table scan              |
