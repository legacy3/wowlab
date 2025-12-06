import type { ClassDefinition } from "../shared/types.js";

import { BeastMastery } from "./beast-mastery.js";

export { BeastMastery } from "./beast-mastery.js";
export { BMSpells, HunterSpells, MMSpells, SVSpells } from "./constants.js";

export const Hunter: ClassDefinition = {
  id: "hunter",
  name: "Hunter",
  specs: [BeastMastery],
};
