import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";
import { execSync } from "node:child_process";

const killProgram = Effect.gen(function* () {
  yield* Effect.logInfo("Searching for development processes ...");

  yield* Effect.try({
    catch: (error) => {
      if (error instanceof Error && error.message.includes("Command failed")) {
        return;
      }
      throw new Error(`Failed to kill processes: ${String(error)}`);
    },
    try: () => {
      const processes = execSync(
        'ps aux | grep -E "(vite|tsx.*dev)" | grep -v grep',
        { encoding: "utf-8" },
      );

      if (!processes.trim()) {
        console.log("No development processes found");
        return;
      }

      console.log("Found processes:");
      console.log(processes);

      const pids = processes
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          return parts[1];
        })
        .filter((pid) => pid && /^\d+$/.test(pid));

      if (pids.length === 0) {
        console.log("No PIDs to kill");
        return;
      }

      console.log(`Killing PIDs: ${pids.join(", ")}`);
      execSync(`kill -9 ${pids.join(" ")}`, { stdio: "inherit" });
      console.log("Development processes terminated");
    },
  });
});

export const killCommand = Command.make("kill", {}, () => killProgram);
