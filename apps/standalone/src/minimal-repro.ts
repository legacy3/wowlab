import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Exit from "effect/Exit";

// Service A (The Dependency, e.g., CoreLayer)
class ServiceA extends Context.Tag("ServiceA")<ServiceA, { value: string }>() {
  static Default = Layer.succeed(this, { value: "A" });
}

// Service B (The Dependent, e.g., ProfileComposer)
class ServiceB extends Context.Tag("ServiceB")<ServiceB, { value: string }>() {
  static Default = Layer.effect(
    this,
    Effect.gen(function* () {
      const a = yield* ServiceA;
      return { value: a.value + "->B" };
    }),
  );
}

const program = Effect.gen(function* () {
  const b = yield* ServiceB;
  console.log("Program result:", b.value);
});

const main = async () => {
  console.log("=".repeat(50));
  console.log("1. BROKEN WAY (Inverted Dependency)");
  console.log("CoreLayer.pipe(Layer.provide(DependentLayer))");
  console.log("This means DependentLayer provides to CoreLayer.");
  console.log("But DependentLayer NEEDS CoreLayer!");
  console.log("=".repeat(50));

  const BrokenLayer = ServiceA.Default.pipe(
    // @ts-ignore - Ignoring type error to show runtime failure
    Layer.provideMerge(ServiceB.Default),
  );

  await Effect.runPromiseExit(program.pipe(Effect.provide(BrokenLayer))).then(
    (exit) => {
      if (Exit.isFailure(exit)) {
        console.log("❌ FAILURE:");
        console.log(exit.cause.toString());
      } else {
        console.log("✅ SUCCESS (Unexpected)");
      }
    },
  );

  console.log("\n" + "=".repeat(50));
  console.log("2. CORRECT WAY");
  console.log("DependentLayer.pipe(Layer.provide(CoreLayer))");
  console.log("This means CoreLayer provides to DependentLayer.");
  console.log("=".repeat(50));

  const WorkingLayer = ServiceB.Default.pipe(
    Layer.provideMerge(ServiceA.Default),
  );

  await Effect.runPromiseExit(program.pipe(Effect.provide(WorkingLayer))).then(
    (exit) => {
      if (Exit.isFailure(exit)) {
        console.log("❌ FAILURE:");
        console.log(exit.cause.toString());
      } else {
        console.log("✅ SUCCESS");
      }
    },
  );
};

main();
