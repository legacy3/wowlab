export interface ApiFunction {
  name: string;
  signature: string;
  description: string;
  snippet: string;
}

export interface ApiCategory {
  name: string;
  functions: ApiFunction[];
}

export const API_REFERENCE: ApiCategory[] = [
  {
    name: "Casting",
    functions: [
      {
        name: "tryCast",
        signature: "tryCast(rotation, playerId, spellId, targetId?)",
        description: "Attempts to cast a spell. Returns { cast, consumedGCD }.",
        snippet: `const result = yield* tryCast(rotation, playerId, SpellIds.SPELL_NAME, targetId);
if (result.cast && result.consumedGCD) {
  return;
}`,
      },
      {
        name: "runPriorityList",
        signature: "runPriorityList(rotation, playerId, spellIds, targetId?)",
        description: "Runs spells in priority order until one consumes GCD.",
        snippet: `yield* runPriorityList(rotation, playerId, [
  SpellIds.SPELL_1,
  SpellIds.SPELL_2,
  SpellIds.SPELL_3,
], targetId);`,
      },
      {
        name: "rotation.spell.cast",
        signature: "rotation.spell.cast(playerId, spellId, targetId?)",
        description: "Low-level cast. Throws on cooldown. Use tryCast instead.",
        snippet: `yield* rotation.spell.cast(playerId, SpellIds.SPELL_NAME, targetId);`,
      },
    ],
  },
  {
    name: "Effect Utilities",
    functions: [
      {
        name: "Effect.gen",
        signature: "Effect.gen(function* () { ... })",
        description:
          "Generator function for Effect. Use yield* to run effects.",
        snippet: `Effect.gen(function* () {
  const rotation = yield* Context.RotationContext;
  // Your rotation logic here
})`,
      },
      {
        name: "Effect.succeed",
        signature: "Effect.succeed(value)",
        description: "Creates an Effect that succeeds with the given value.",
        snippet: `Effect.succeed(value)`,
      },
      {
        name: "Effect.fail",
        signature: "Effect.fail(error)",
        description: "Creates an Effect that fails with the given error.",
        snippet: `Effect.fail(new Error("Something went wrong"))`,
      },
    ],
  },
  {
    name: "Context",
    functions: [
      {
        name: "RotationContext",
        signature: "yield* Context.RotationContext",
        description: "Access the rotation context with spell casting methods.",
        snippet: `const rotation = yield* Context.RotationContext;`,
      },
    ],
  },
];
