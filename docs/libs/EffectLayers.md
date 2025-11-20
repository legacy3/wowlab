# Effect Layer - Complete API Reference

**Source:** Official Effect documentation (effect-ts.dev)

## Overview

Layers are the Effect-TS abstraction for **constructing services** and managing their dependencies. They solve the problem of dependency injection by creating a clear "dependency graph" for your application, keeping service interfaces clean while managing complex construction logic separately.

### Key Concepts

| Concept     | Description                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| **service** | A reusable component providing specific functionality, used across different parts of an application.                     |
| **tag**     | A unique identifier representing a **service**, allowing Effect to locate and use it.                                     |
| **context** | A collection storing services, functioning like a map with **tags** as keys and **services** as values.                   |
| **layer**   | An abstraction for constructing **services**, managing dependencies during construction rather than at the service level. |

## Layer Type Signature

```typescript
Layer<RequirementsOut, Error, RequirementsIn>
```

| Parameter         | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `RequirementsOut` | The service or resource to be created (what the layer provides).           |
| `Error`           | The type of error that might occur during the construction of the service. |
| `RequirementsIn`  | The dependencies required to construct the service.                        |

**Examples:**

```typescript
Layer<Config>                          // No dependencies, no errors
Layer<Logger, never, Config>           // Depends on Config
Layer<Database, never, Config | Logger> // Depends on Config AND Logger
```

## Why Layers?

### The Problem: Requirement Leakage

**❌ BAD - Leaking dependencies into service interface:**

```typescript
class Database extends Context.Tag("Database")<
  Database,
  {
    // Dependencies leak into the service interface
    readonly query: (sql: string) => Effect.Effect<unknown, never, Config | Logger>
  }
>() {}
```

This makes testing difficult and exposes implementation details.

**✅ GOOD - Service interface has no requirements:**

```typescript
class Database extends Context.Tag("Database")<
  Database,
  {
    // Clean interface - no dependencies required
    readonly query: (sql: string) => Effect.Effect<unknown>
  }
>() {}
```

Dependencies are managed at the **construction level** (in layers), not the service level.

### Rule: Service Operations Should Have `Requirements = never`

```text
                         ┌─── No dependencies required
                         ▼
Effect<Success, Error, never>
```

## Creating Layers

### Layer Constructors

| Constructor       | Use Case                                           | Signature                                                     |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `Layer.succeed`   | Static value (already computed)                    | `Layer.succeed(tag, value)`                                   |
| `Layer.sync`      | Synchronous computation (lazy)                     | `Layer.sync(tag, () => value)`                                |
| `Layer.effect`    | Effectful computation (async, can access services) | `Layer.effect(tag, Effect.gen(...))`                          |
| `Layer.scoped`    | Resource with cleanup (database connections, etc.) | `Layer.scoped(tag, Effect.gen(...) with acquireRelease)`      |

### 1. Layer.succeed - Static Value

```typescript
import { Effect, Context, Layer } from "effect"

class Config extends Context.Tag("Config")<
  Config,
  {
    readonly getConfig: Effect.Effect<{
      readonly logLevel: string
      readonly connection: string
    }>
  }
>() {}

// Layer<Config, never, never>
const ConfigLive = Layer.succeed(Config, {
  getConfig: Effect.succeed({
    logLevel: "INFO",
    connection: "mysql://username:password@hostname:port/database_name"
  })
})
```

**Note:** You can use `Config.of(...)` helper for type inference, but it's optional.

### 2. Layer.sync - Lazy Synchronous

```typescript
import { Layer, Random } from "effect"

class Sync extends Effect.Service<Sync>()(\"Sync\", {
  sync: () => ({
    next: Random.nextInt
  })
})

// Lazily computes value when layer is built
const SyncLayer = Layer.sync(Sync, () => ({ next: Random.nextInt }))
```

### 3. Layer.effect - Effectful Construction

Used when construction requires accessing other services or performing effects.

```typescript
import { Effect, Context, Layer } from "effect"

class Logger extends Context.Tag("Logger")<
  Logger,
  { readonly log: (message: string) => Effect.Effect<void> }
>() {}

// Layer<Logger, never, Config>
const LoggerLive = Layer.effect(
  Logger,
  Effect.gen(function* () {
    // Access the Config service during construction
    const config = yield* Config
    return {
      log: (message) =>
        Effect.gen(function* () {
          const { logLevel } = yield* config.getConfig
          console.log(`[${logLevel}] ${message}`)
        })
    }
  })
)
```

**Key Point:** `LoggerLive` requires `Config` to be provided.

### 4. Layer.scoped - Resource Management

For resources that need cleanup (connections, file handles, etc.).

```typescript
import { Effect, Layer, Console } from "effect"

class Scoped extends Effect.Service<Scoped>()(\"Scoped\", {
  scoped: Effect.gen(function* () {
    // Acquire the resource and ensure it is properly released
    const resource = yield* Effect.acquireRelease(
      Console.log("Acquiring...").pipe(Effect.as("resource")),
      () => Console.log("Releasing...")
    )
    // Register a finalizer to run when the effect is completed
    yield* Effect.addFinalizer(() => Console.log("Shutting down"))
    return { resource }
  })
})

// When provided, will properly cleanup when the scope closes
```

**Signature:**

```typescript
Layer.scoped<I, S, E, R>(
  tag: Context.Tag<I, S>,
  effect: Effect.Effect<S, E, R>
): Layer<I, E, Exclude<R, Scope.Scope>>
```

Note: `Scope` is automatically excluded from the requirements.

## Combining Layers

### 1. Layer.merge - Parallel Composition

Merges two layers **concurrently**, combining their inputs and outputs.

```typescript
import { Layer } from "effect"

declare const layer1: Layer.Layer<"Out1", never, "In1">
declare const layer2: Layer.Layer<"Out2", never, "In2">

// Layer<"Out1" | "Out2", never, "In1" | "In2">
const merged = Layer.merge(layer1, layer2)
```

**Result:**
- **Requires:** All services that both layers require (`"In1" | "In2"`)
- **Provides:** All services that both layers provide (`"Out1" | "Out2"`)

**Example:**

```typescript
// Layer<Config | Logger, never, Config>
const AppConfigLive = Layer.merge(ConfigLive, LoggerLive)
```

### 2. Layer.mergeAll - Merge Multiple Layers

```typescript
const mergedAll = Layer.mergeAll(layer1, layer2, layer3, ...)
```

Combines all provided layers concurrently.

### 3. Layer.provide - Sequential Composition

Provides the output of one layer as input to another (dependency injection).

```typescript
import { Layer } from "effect"

declare const inner: Layer.Layer<"OutInner", never, "InInner">
declare const outer: Layer.Layer<"InInner", never, "InOuter">

// Layer<"OutInner", never, "InOuter">
const composition = Layer.provide(inner, outer)
```

**Result:**
- **Requires:** What the outer layer requires (`"InOuter"`)
- **Provides:** What the inner layer provides (`"OutInner"`)

**Example:**

```typescript
// Layer<Database, never, never>
const MainLive = DatabaseLive.pipe(
  // DatabaseLive needs Config | Logger
  Layer.provide(AppConfigLive), // AppConfigLive needs Config
  Layer.provide(ConfigLive)      // ConfigLive needs nothing
)
```

### 4. Layer.provideMerge - Provide and Keep Outputs

Like `Layer.provide` but **also includes the outputs of the provided layer**.

```typescript
// Layer<Config | Database, never, never>
const MainLive = DatabaseLive.pipe(
  Layer.provide(AppConfigLive),
  Layer.provideMerge(ConfigLive) // Config is now available in output
)
```

**Result:**
- **Provides:** Both `Database` (from inner) AND `Config` (from outer)

### 5. Layer.passthrough - Pass Inputs Through

Returns a new layer that produces outputs but **also passes through the inputs**.

```typescript
// Layer<RIn | ROut, E, RIn>
const passthroughLayer = Layer.passthrough(someLayer)
```

## Providing Layers to Effects

Once you have a fully resolved layer, provide it to your program:

```typescript
const program = Effect.gen(function* () {
  const database = yield* Database
  const result = yield* database.query("SELECT * FROM users")
  return result
})

// Effect<unknown, never, never>
const runnable = Effect.provide(program, MainLive)

Effect.runPromise(runnable).then(console.log)
```

Note: `runnable` has `Requirements = never`, meaning it's ready to run.

## Converting Layers to Effects

### Layer.launch

Converts a layer to an effect, constructs it, and keeps it alive until interrupted.

```typescript
import { Console, Context, Effect, Layer } from "effect"

class HTTPServer extends Context.Tag("HTTPServer")<HTTPServer, void>() {}

const server = Layer.effect(
  HTTPServer,
  Console.log("Listening on http://localhost:3000")
)

// Launches the server and keeps it running
Effect.runFork(Layer.launch(server))
```

### Layer.build

Builds a layer into a scoped value.

```typescript
declare const build: <RIn, E, ROut>(
  self: Layer<ROut, E, RIn>,
) => Effect.Effect<Context.Context<ROut>, E, Scope.Scope | RIn>
```

## Tapping into Layer Lifecycle

### Layer.tap - On Success

Execute an effect when the layer is successfully acquired.

```typescript
const server = Layer.effect(HTTPServer, ...).pipe(
  Layer.tap((ctx) =>
    Console.log(`Layer acquired with: ${ctx}`)
  )
)
```

### Layer.tapError - On Failure

Execute an effect when the layer fails to acquire.

```typescript
const server = Layer.effect(HTTPServer, ...).pipe(
  Layer.tapError((err) =>
    Console.log(`Layer failed with: ${err}`)
  )
)
```

## Error Handling

### Layer.catchAll

Recover from errors by providing a fallback layer.

```typescript
const server = Layer.effect(
  HTTPServer,
  Effect.gen(function* () {
    const host = yield* Config.string("HOST")
    console.log(`Listening on http://localhost:${host}`)
  })
).pipe(
  Layer.catchAll((configError) =>
    Layer.effect(
      HTTPServer,
      Effect.gen(function* () {
        console.log(`Recovering from error: ${configError}`)
        console.log(`Listening on http://localhost:3000`)
      })
    )
  )
)
```

### Layer.orElse

Simpler fallback without access to the error.

```typescript
const database = postgresDatabaseLayer.pipe(
  Layer.orElse(() => inMemoryDatabaseLayer)
)
```

### Layer.catchAllCause

Like `catchAll` but receives the full `Cause` instead of just the error.

## Testing & Mocking

### Layer.mock - Partial Mock

Creates a mock layer for testing. Unimplemented methods throw `UnimplementedError`.

```typescript
import { Context, Effect, Layer } from "effect"

class MyService extends Context.Tag("MyService")<
  MyService,
  {
    one: Effect.Effect<number>
    two(): Effect.Effect<number>
  }
>() {}

// Only implement what you need for your test
const MyServiceTest = Layer.mock(MyService, {
  two: () => Effect.succeed(2)
  // 'one' will throw UnimplementedError if called
})
```

### Layer.fresh

Creates a fresh version of a layer that **will not be shared** (bypasses memoization).

```typescript
const freshLayer = Layer.fresh(someLayer)
```

By default, layers are memoized and shared. Use `fresh` when you need a new instance.

### Layer.memoize

Returns a scoped effect that lazily computes and memoizes the layer.

```typescript
declare const memoize: <RIn, E, ROut>(
  self: Layer<ROut, E, RIn>,
) => Effect.Effect<Layer<ROut, E, RIn>, never, Scope.Scope>
```

## Layer Naming Conventions

| Suffix   | Purpose                                          |
| -------- | ------------------------------------------------ |
| `Live`   | Production implementation (`DatabaseLive`)       |
| `Test`   | Test/mock implementation (`DatabaseTest`)        |
| `Mock`   | Partial mock using `Layer.mock`                  |

**Example:**

```typescript
const DatabaseLive = Layer.effect(Database, /* real implementation */)
const DatabaseTest = Layer.succeed(Database, /* test stub */)
const DatabaseMock = Layer.mock(Database, { /* partial mock */ })
```

## Effect.Service API - Simplified Service Definition

The `Effect.Service` API combines tag creation, implementation, and layer generation in one step.

### Basic Usage

```typescript
import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"
import { Effect } from "effect"

class Cache extends Effect.Service<Cache>()(\"app/Cache\", {
  // Define how to create the service
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const lookup = (key: string) => fs.readFileString(`cache/${key}`)
    return { lookup } as const
  }),
  // Specify dependencies
  dependencies: [NodeFileSystem.layer]
}) {}
```

### Generated Layers

`Effect.Service` automatically generates:

| Layer                              | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `Cache.Default`                    | Includes all dependencies (ready to use)                       |
| `Cache.DefaultWithoutDependencies` | Requires dependencies to be provided separately (for testing)  |

**Usage:**

```typescript
// Production - includes filesystem
const runnable = program.pipe(Effect.provide(Cache.Default))

// Testing - inject test filesystem
const testRunnable = program.pipe(
  Effect.provide(Cache.DefaultWithoutDependencies),
  Effect.provide(FileSystemTest)
)
```

### Service Constructor Options

| Method    | Description                                        |
| --------- | -------------------------------------------------- |
| `effect`  | Effectful constructor (async, can access services) |
| `sync`    | Synchronous constructor (lazy)                     |
| `succeed` | Static implementation (already computed)           |
| `scoped`  | Resource with lifecycle management                 |

**Example - Static Implementation:**

```typescript
class Sync extends Effect.Service<Sync>()(\"Sync\", {
  sync: () => ({
    next: Random.nextInt
  })
}) {}
```

**Example - Scoped Resource:**

```typescript
class Scoped extends Effect.Service<Scoped>()(\"Scoped\", {
  scoped: Effect.gen(function* () {
    const resource = yield* Effect.acquireRelease(
      Console.log("Acquiring...").pipe(Effect.as("foo")),
      () => Console.log("Releasing...")
    )
    yield* Effect.addFinalizer(() => Console.log("Shutting down"))
    return { resource }
  })
}) {}
```

### Direct Method Access

Enable with `accessors: true`:

```typescript
class Sync extends Effect.Service<Sync>()(\"Sync\", {
  sync: () => ({
    next: Random.nextInt
  }),
  accessors: true // Enable direct access
}) {}

const program = Effect.gen(function* () {
  // No need to extract service first
  const n = yield* Sync.next
  console.log(`The number is ${n}`)
})
```

**⚠️ Limitation:** Direct method access does not work with generic methods.

### Mocking with Effect.Service

**Option 1: Mock dependencies**

```typescript
const FileSystemTest = FileSystem.layerNoop({
  readFileString: () => Effect.succeed("File Content...")
})

const runnable = program.pipe(
  Effect.provide(Cache.DefaultWithoutDependencies),
  Effect.provide(FileSystemTest)
)
```

**Option 2: Mock the service directly**

```typescript
const cache = new Cache({
  lookup: () => Effect.succeed("Cache Content...")
})

const runnable = program.pipe(Effect.provideService(Cache, cache))
```

## Effect.Service vs Context.Tag

| Feature                             | Effect.Service                                          | Context.Tag                               |
| ----------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| Tag creation                        | Generated for you (class name acts as tag)              | You declare the tag manually              |
| Default implementation              | **Required** - supplied inline (`effect`, `sync`, etc.) | **Optional** - can be supplied later      |
| Ready-made layers (`.Default`, ...) | Automatically generated                                 | You build layers yourself                 |
| Best suited for                     | Application code with a clear runtime implementation    | Library code or dynamically-scoped values |
| When no sensible default exists     | Not ideal; you would still have to invent one           | Preferred                                 |

**Key Decision:**

- **Use `Effect.Service`** for application-level services with clear runtime implementations (logging, HTTP clients, databases)
- **Use `Context.Tag`** for library code or when there's no sensible default (per-request handles, configurable services)

## Advanced Patterns

### Layer.flatMap

Transform the output of a layer.

```typescript
declare const flatMap: <A, E, R>(
  layer: Layer<A, E, R>,
  f: (a: A) => Layer<B, E2, R2>
) => Layer<B, E | E2, R | R2>
```

### Layer.flatten

Unwrap a nested layer.

### Layer.extendScope

Extends the scope of a layer.

### Layer.context

Constructs a layer that passes along the given context as an output.

### Layer.empty

An empty layer with no outputs.

```typescript
const empty: Layer<never, never, never>
```

## Complete Example: Building a Web Application

```typescript
import { Effect, Context, Layer } from "effect"

// 1. Define Services
class Config extends Context.Tag("Config")<
  Config,
  {
    readonly getConfig: Effect.Effect<{
      readonly logLevel: string
      readonly connection: string
    }>
  }
>() {}

class Logger extends Context.Tag("Logger")<
  Logger,
  { readonly log: (message: string) => Effect.Effect<void> }
>() {}

class Database extends Context.Tag("Database")<
  Database,
  { readonly query: (sql: string) => Effect.Effect<unknown> }
>() {}

// 2. Create Layers
const ConfigLive = Layer.succeed(Config, {
  getConfig: Effect.succeed({
    logLevel: "INFO",
    connection: "mysql://username:password@hostname:port/database_name"
  })
})

const LoggerLive = Layer.effect(
  Logger,
  Effect.gen(function* () {
    const config = yield* Config
    return {
      log: (message) =>
        Effect.gen(function* () {
          const { logLevel } = yield* config.getConfig
          console.log(`[${logLevel}] ${message}`)
        })
    }
  })
)

const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config
    const logger = yield* Logger
    return {
      query: (sql: string) =>
        Effect.gen(function* () {
          yield* logger.log(`Executing query: ${sql}`)
          const { connection } = yield* config.getConfig
          return { result: `Results from ${connection}` }
        })
    }
  })
)

// 3. Combine Layers
const AppConfigLive = Layer.merge(ConfigLive, LoggerLive)

const MainLive = DatabaseLive.pipe(
  Layer.provide(AppConfigLive),
  Layer.provide(ConfigLive)
)

// 4. Use in Program
const program = Effect.gen(function* () {
  const database = yield* Database
  const result = yield* database.query("SELECT * FROM users")
  return result
})

const runnable = Effect.provide(program, MainLive)

Effect.runPromise(runnable).then(console.log)
// Output:
// [INFO] Executing query: SELECT * FROM users
// { result: 'Results from mysql://username:password@hostname:port/database_name' }
```

## API Quick Reference

### Constructors

| Function          | Signature                                                 | Description                         |
| ----------------- | --------------------------------------------------------- | ----------------------------------- |
| `Layer.succeed`   | `(tag, value) => Layer<I>`                                | Static value                        |
| `Layer.sync`      | `(tag, () => value) => Layer<I>`                          | Lazy synchronous                    |
| `Layer.effect`    | `(tag, Effect<S, E, R>) => Layer<I, E, R>`                | Effectful construction              |
| `Layer.scoped`    | `(tag, Effect<S, E, R>) => Layer<I, E, Exclude<R, Scope>>`| Resource with cleanup               |

### Combinators

| Function             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `Layer.merge`        | Merge two layers concurrently                    |
| `Layer.mergeAll`     | Merge multiple layers concurrently               |
| `Layer.provide`      | Sequential composition (dependency injection)    |
| `Layer.provideMerge` | Provide dependencies and keep outputs            |
| `Layer.passthrough`  | Pass inputs through to outputs                   |

### Lifecycle

| Function         | Description                                 |
| ---------------- | ------------------------------------------- |
| `Layer.build`    | Build layer into scoped value               |
| `Layer.launch`   | Convert to effect and keep alive            |
| `Layer.tap`      | Execute effect on success                   |
| `Layer.tapError` | Execute effect on failure                   |

### Error Handling

| Function              | Description                         |
| --------------------- | ----------------------------------- |
| `Layer.catchAll`      | Recover with fallback layer         |
| `Layer.orElse`        | Simple fallback                     |
| `Layer.catchAllCause` | Recover with access to full Cause   |

### Testing

| Function       | Description                            |
| -------------- | -------------------------------------- |
| `Layer.mock`   | Create partial mock                    |
| `Layer.fresh`  | Bypass memoization                     |
| `Layer.memoize`| Manually control memoization           |

### Transformation

| Function         | Description                         |
| ---------------- | ----------------------------------- |
| `Layer.map`      | Transform output                    |
| `Layer.mapError` | Transform error                     |
| `Layer.flatMap`  | Chain layers                        |
| `Layer.flatten`  | Unwrap nested layer                 |

### Other

| Function           | Description                         |
| ------------------ | ----------------------------------- |
| `Layer.context`    | Pass context through as output      |
| `Layer.empty`      | Empty layer                         |
| `Layer.extendScope`| Extend scope of layer               |
| `Layer.isLayer`    | Type guard                          |
| `Layer.isFresh`    | Check if layer is fresh             |

## Best Practices

1. **Keep service interfaces clean** - Operations should have `Requirements = never`
2. **Use naming conventions** - `ServiceLive`, `ServiceTest`, `ServiceMock`
3. **Separate construction from usage** - Dependencies in layers, not service interfaces
4. **Use `Effect.Service`** for application services with clear defaults
5. **Use `Context.Tag`** for library services or when no default makes sense
6. **Memoization is default** - Use `Layer.fresh` when you need separate instances
7. **Test with mocks** - Use `Layer.mock` or provide test implementations
8. **Handle resources properly** - Use `Layer.scoped` for resources that need cleanup

## Type Helpers

```typescript
import { Layer } from "effect"

// Extract types from a layer
type MyLayerContext = Layer.Layer.Context<typeof MyLayer>  // Input requirements
type MyLayerSuccess = Layer.Layer.Success<typeof MyLayer>  // Output services
type MyLayerError = Layer.Layer.Error<typeof MyLayer>      // Error type
```

---

**Reference:** [Effect Documentation - Managing Layers](https://effect-ts.dev/docs/requirements-management/layers)
