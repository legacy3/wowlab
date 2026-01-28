type EngineModule = typeof import("wowlab-engine");

let cachedModule: EngineModule | null = null;
let initPromise: Promise<EngineModule> | null = null;

export async function getEngine(): Promise<EngineModule> {
  if (cachedModule) {
    return cachedModule;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const m = await import("wowlab-engine");
      await m.default();

      cachedModule = m;

      return m;
    })();
  }

  return initPromise;
}

export function isEngineReady(): boolean {
  return cachedModule !== null;
}
