import * as Entities from "@packages/innocent-domain/Entities";

import { HeatingUpModifier } from "../modifiers/HeatingUpModifier";

export class Fireball extends Entities.Spell {
  static readonly MODIFIERS = [HeatingUpModifier];
}
