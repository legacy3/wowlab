import * as Branded from "@packages/innocent-schemas/Branded";

export interface AuraDefinition {
  duration: number;
  id: Branded.SpellID;
  maxStacks: number;
  name: string;
}
