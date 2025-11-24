import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

const helloWorldProgram = Effect.gen(function* () {
  yield* Effect.logInfo("Hello, World!");
  console.log("Hello from wowlab CLI!");
});

export const helloWorldCommand = Command.make(
  "hello-world",
  {},
  () => helloWorldProgram,
);
