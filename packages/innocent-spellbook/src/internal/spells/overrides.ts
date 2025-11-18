import type { SpellOverrideEntry } from "./types";

import { MAGE_FIRE_OVERRIDES } from "./mage/fire/overrides/index";

export const SPEC_SPELL_OVERRIDES: Record<
  string,
  readonly SpellOverrideEntry[]
> = {
  "spec-mage-fire": MAGE_FIRE_OVERRIDES,
};
