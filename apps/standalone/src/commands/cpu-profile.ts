import { Args, Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of simulation iterations"),
  Options.withDefault(500),
);

const durationOpt = Options.integer("duration").pipe(
  Options.withAlias("d"),
  Options.withDescription("Simulation duration in seconds"),
  Options.withDefault(60),
);

const topOpt = Options.integer("top").pipe(
  Options.withAlias("t"),
  Options.withDescription("Number of top functions to show"),
  Options.withDefault(40),
);

const rotationArg = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("beast-mastery"),
);

interface ProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    url: string;
    lineNumber: number;
  };
}

interface CpuProfile {
  nodes: ProfileNode[];
  samples: number[];
  timeDeltas: number[];
}

const parseProfile = (profilePath: string, top: number) =>
  Effect.gen(function* () {
    const content = fs.readFileSync(profilePath, "utf8");
    const profile: CpuProfile = JSON.parse(content);

    const nodes = profile.nodes || [];
    const samples = profile.samples || [];

    // Count samples per node
    const sampleCounts: Record<number, number> = {};
    for (const nodeId of samples) {
      sampleCounts[nodeId] = (sampleCounts[nodeId] || 0) + 1;
    }

    // Build node info map
    const nodeInfo: {
      name: string;
      url: string;
      line: number;
      count: number;
      category: string;
    }[] = [];

    for (const node of nodes) {
      const url = node.callFrame?.url || "";
      const count = sampleCounts[node.id] || 0;
      if (count === 0) continue;

      // Categorize
      let category = "app";
      if (url.includes("node:") || url === "") {
        category = "node";
      } else if (url.includes("effect/")) {
        category = "effect";
      } else if (url.includes("immutable")) {
        category = "immutable";
      } else if (url.includes("node_modules")) {
        category = "deps";
      }

      nodeInfo.push({
        name: node.callFrame?.functionName || "(anonymous)",
        url,
        line: node.callFrame?.lineNumber || 0,
        count,
        category,
      });
    }

    // Sort by sample count
    nodeInfo.sort((a, b) => b.count - a.count);

    const total = samples.length;

    // Category totals
    const categoryTotals: Record<string, number> = {};
    for (const info of nodeInfo) {
      categoryTotals[info.category] =
        (categoryTotals[info.category] || 0) + info.count;
    }

    yield* Effect.log("");
    yield* Effect.log("=== CPU Profile Summary ===");
    yield* Effect.log("");
    yield* Effect.log("Category breakdown:");
    for (const [cat, count] of Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1],
    )) {
      const pct = ((count / total) * 100).toFixed(1);
      yield* Effect.log(`  ${cat.padEnd(12)} ${pct.padStart(6)}%`);
    }

    yield* Effect.log("");
    yield* Effect.log(`Top ${top} functions (excluding node internals):`);
    yield* Effect.log(
      "samples |   %   | category  | function                           | location",
    );
    yield* Effect.log(
      "--------+-------+-----------+------------------------------------+---------",
    );

    let shown = 0;
    for (const info of nodeInfo) {
      if (info.category === "node") continue;
      if (shown >= top) break;

      const pct = ((info.count / total) * 100).toFixed(1);
      const file = info.url.split("/").slice(-2).join("/");
      const loc = file ? `${file}:${info.line}` : "";

      yield* Effect.log(
        `${String(info.count).padStart(7)} | ${pct.padStart(5)}% | ${info.category.padEnd(9)} | ${info.name.slice(0, 34).padEnd(34)} | ${loc}`,
      );
      shown++;
    }

    yield* Effect.log("");
  });

export const cpuProfileCommand = Command.make(
  "cpu-profile",
  {
    iterations: iterationsOpt,
    duration: durationOpt,
    top: topOpt,
    rotation: rotationArg,
  },
  ({ iterations, duration, top, rotation }) =>
    Effect.gen(function* () {
      const profileDir = path.resolve("./profiles");
      const distPath = path.resolve("./dist/index.js");

      // Clean up old profiles
      if (fs.existsSync(profileDir)) {
        fs.rmSync(profileDir, { recursive: true });
      }
      fs.mkdirSync(profileDir, { recursive: true });

      yield* Effect.log(
        `Running ${iterations} iterations with CPU profiler ...`,
      );
      yield* Effect.log(`Rotation: ${rotation}, Duration: ${duration}s`);
      yield* Effect.log("");

      // Spawn node with CPU profiler
      const result = yield* Effect.tryPromise(
        () =>
          new Promise<{ code: number; stdout: string; stderr: string }>(
            (resolve, reject) => {
              const args = [
                "--cpu-prof",
                `--cpu-prof-dir=${profileDir}`,
                distPath,
                "run",
                `-n`,
                String(iterations),
                `-w`,
                "0",
                `-d`,
                String(duration),
                rotation,
              ];

              const child = spawn("node", args, {
                env: process.env,
                stdio: ["inherit", "pipe", "pipe"],
              });

              let stdout = "";
              let stderr = "";

              child.stdout?.on("data", (data) => {
                stdout += data.toString();
                process.stdout.write(data);
              });

              child.stderr?.on("data", (data) => {
                stderr += data.toString();
                process.stderr.write(data);
              });

              child.on("close", (code) => {
                resolve({ code: code ?? 0, stdout, stderr });
              });

              child.on("error", reject);
            },
          ),
      );

      if (result.code !== 0) {
        yield* Effect.fail(
          new Error(`Process exited with code ${result.code}`),
        );
      }

      // Find the profile file
      const files = fs.readdirSync(profileDir);
      const profileFile = files.find((f) => f.endsWith(".cpuprofile"));

      if (!profileFile) {
        yield* Effect.fail(new Error("No CPU profile file generated"));
      }

      const profilePath = path.join(profileDir, profileFile!);
      yield* Effect.log(`\nProfile saved to: ${profilePath}`);

      // Parse and display
      yield* parseProfile(profilePath, top);

      yield* Effect.log(`Profile file: ${profilePath}`);
      yield* Effect.log(
        "Open in Chrome DevTools: chrome://inspect -> Open dedicated DevTools for Node",
      );
    }),
);
