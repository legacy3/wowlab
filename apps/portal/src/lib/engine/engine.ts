type EngineModule = typeof import("wowlab-engine");

let module: EngineModule | null = null;
let initPromise: Promise<EngineModule> | null = null;
let initError: Error | null = null;

async function init(): Promise<EngineModule> {
  if (module) return module;
  if (initError) throw initError;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const m = await import("wowlab-engine");
        await m.default();
        module = m;
        return m;
      } catch (err) {
        initError = err instanceof Error ? err : new Error(String(err));
        initPromise = null;
        throw initError;
      }
    })();
  }

  return initPromise;
}

export const engine = {
  clearError() {
    initError = null;
    initPromise = null;
  },

  get error() {
    return initError;
  },

  init,

  get isReady() {
    return module !== null;
  },

  async parseRotation(json: string): Promise<import("wowlab-engine").Rotation> {
    const m = await init();
    return m.parseRotation(json);
  },

  async parseSimc(input: string): Promise<import("wowlab-engine").Profile> {
    const m = await init();
    return m.parseSimc(input);
  },

  schema: {
    async attributes(): Promise<[string, number][]> {
      const m = await init();
      return m.getAttributes();
    },

    async damageSchools(): Promise<import("wowlab-engine").DamageSchoolInfo[]> {
      const m = await init();
      return m.getDamageSchools();
    },

    async derivedStats(): Promise<[string, string][]> {
      const m = await init();
      return m.getDerivedStats();
    },

    async effectConditions(): Promise<
      import("wowlab-engine").ConditionFieldDef[]
    > {
      const m = await init();
      return m.getEffectConditionSchema();
    },

    async modConditions(): Promise<
      import("wowlab-engine").ConditionFieldDef[]
    > {
      const m = await init();
      return m.getModConditionSchema();
    },

    async ratings(): Promise<[string, number][]> {
      const m = await init();
      return m.getRatingTypes();
    },

    async resources(): Promise<import("wowlab-engine").ResourceTypeInfo[]> {
      const m = await init();
      return m.getResourceTypes();
    },

    async varPaths(): Promise<import("wowlab-engine").VarPathCategory[]> {
      const m = await init();
      return m.getVarPathSchema();
    },
  },

  async validate(
    json: string,
  ): Promise<import("wowlab-engine").ValidationResult> {
    const m = await init();
    return m.validateRotation(json);
  },

  async version(): Promise<string> {
    const m = await init();
    return m.getEngineVersion();
  },
};
