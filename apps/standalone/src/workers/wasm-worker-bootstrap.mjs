// Bootstrap for WASM worker - uses tsx to run the actual worker
import { register } from "tsx/esm/api";

// Register tsx for TypeScript support
register();

// Now import and run the actual worker
await import("./wasm-worker.ts");
