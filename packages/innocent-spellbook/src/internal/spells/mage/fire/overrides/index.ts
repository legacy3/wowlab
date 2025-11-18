import { Fireball } from "./Fireball";
import { FireBlast } from "./FireBlast";
import { Pyroblast } from "./Pyroblast";

export const MAGE_FIRE_OVERRIDES = [
  { override: Fireball, spellId: 133 },
  { override: FireBlast, spellId: 108853 },
  { override: Pyroblast, spellId: 11366 },
] as const;

export { Fireball } from "./Fireball";
export { FireBlast } from "./FireBlast";
export { Pyroblast } from "./Pyroblast";
