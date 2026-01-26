/**
 * Singleton lazy loader for wowlab-engine WASM module.
 * Uses a promise-based pattern for deduplication.
 */

type EngineModule = typeof import("wowlab-engine");

let module: EngineModule | null = null;
let initPromise: Promise<EngineModule> | null = null;

/**
 * Get the initialized engine module.
 * Initializes on first call, returns cached module on subsequent calls.
 * Throws if initialization fails.
 */
export async function getEngine(): Promise<EngineModule> {
  if (module) {
    return module;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const m = await import("wowlab-engine");
      await m.default();
      module = m;
      return m;
    })();
  }

  return initPromise;
}

/**
 * Check if the engine module is already initialized.
 * Useful for conditional rendering without triggering initialization.
 */
export function isEngineReady(): boolean {
  return module !== null;
}
