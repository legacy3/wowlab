# Writing Rotations

Rotations are priority lists written in JavaScript. All you write is the spell priority. The framework handles everything else.

## What you write

```typescript
yield * tryCast(rotation, playerId, BESTIAL_WRATH);
yield * tryCast(rotation, playerId, BARBED_SHOT, targetId);
yield * tryCast(rotation, playerId, KILL_COMMAND, targetId);
yield * tryCast(rotation, playerId, COBRA_SHOT, targetId);
```

That's it. Top to bottom priority. The simulation handles cooldowns, GCDs, and timing.

## It's just JavaScript

Your rotation runs as a closure, so you have full access to JavaScript. The `yield*` syntax comes from [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator). Think of it like `await`, it runs the cast and continues.

**Only the order of casts matters.** Use any logic you want to decide what to cast:

```typescript
// Loop through enemies and multi-dot
for (const enemy of enemies) {
  if (!hasDebuff(enemy, CORRUPTION)) {
    yield * tryCast(rotation, playerId, CORRUPTION, enemy.id);
  }
}

// Conditional logic
if (playerHealth < 30) {
  yield * tryCast(rotation, playerId, HEALTHSTONE);
}

// Pool resources
if (energy < 80 && !buffActive(TIGER_FURY)) {
  return; // Wait for energy
}

// Normal priority
yield * tryCast(rotation, playerId, FEROCIOUS_BITE, targetId);
yield * tryCast(rotation, playerId, RAKE, targetId);
```

You can also define helper functions:

```typescript
function shouldRefreshDot(target, debuff, pandemic) {
  return getDebuffRemaining(target, debuff) < pandemic;
}

// Use it in your rotation
if (shouldRefreshDot(targetId, RAKE, 4.5)) {
  yield * tryCast(rotation, playerId, RAKE, targetId);
}
```

Or even wrap `tryCast` with your own Effect generator:

```typescript
function* castOnTarget(spell) {
  yield* tryCast(rotation, playerId, spell, targetId);
}

// Cleaner rotation code
yield * castOnTarget(RAKE);
yield * castOnTarget(FEROCIOUS_BITE);
```

This means you can use all normal JavaScript control structures without learning a custom DSL. Check out [existing rotations](/rotations) for examples. If you want to understand how the underlying [Effect](https://effect.website/docs/getting-started/introduction) library works, the docs are excellent, but you don't need it for writing rotations.
