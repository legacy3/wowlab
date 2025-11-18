import * as Entities from "@packages/innocent-domain/Entities";

import { HotStreakModifier } from "../modifiers/HotStreakModifier";

export class Pyroblast extends Entities.Spell {
  static readonly MODIFIERS = [HotStreakModifier];
}
