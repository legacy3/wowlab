import * as Entities from "@packages/innocent-domain/Entities";

import { HeatingUpModifier } from "../modifiers/HeatingUpModifier";

export class FireBlast extends Entities.Spell {
  static readonly MODIFIERS = [HeatingUpModifier];
}
