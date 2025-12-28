import { parentPort } from "node:worker_threads";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { initSync, Simulator } from "../../wasm/engine.js";

export interface WasmWorkerInit {
  type: "init";
  config: object;
}

export interface WasmWorkerBatch {
  type: "batch";
  batchId: number;
  iterations: number;
  baseSeed: number;
}

export interface WasmBatchResult {
  batchId: number;
  meanDps: number;
  minDps: number;
  maxDps: number;
  totalCasts: number;
  iterations: number;
}

// Initialize WASM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wasmPath = path.resolve(__dirname, "../../wasm/engine_bg.wasm");
const wasmBuffer = fs.readFileSync(wasmPath);
initSync({ module: wasmBuffer });

let simulator: Simulator | null = null;

parentPort?.on("message", (msg: WasmWorkerInit | WasmWorkerBatch) => {
  if (msg.type === "init") {
    simulator = new Simulator(JSON.stringify(msg.config));
    parentPort?.postMessage({ type: "ready" });
  } else if (msg.type === "batch") {
    if (!simulator) {
      parentPort?.postMessage({
        type: "error",
        error: "Simulator not initialized",
      });

      return;
    }

    const result = simulator.run_batch(msg.iterations, BigInt(msg.baseSeed));

    parentPort?.postMessage({
      type: "result",
      result: {
        batchId: msg.batchId,
        meanDps: result.mean_dps,
        minDps: result.min_dps,
        maxDps: result.max_dps,
        totalCasts: result.total_casts,
        iterations: msg.iterations,
      } as WasmBatchResult,
    });
  }
});

parentPort?.postMessage({ type: "started" });
