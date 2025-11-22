export interface CliOptions {
  batch: number;
  clear: boolean;
  dryRun: boolean;
  items: string;
}

export interface ItemDataFlat {
  binding: number;
  buyPrice: number;
  classId: number;
  description: string;
  effects: {
    spellId: number;
    triggerType: number;
    charges: number;
    cooldown: number;
    categoryCooldown: number;
  }[];
  iconPath: string;
  id: number;
  inventoryType: number;
  itemLevel: number;
  maxCount: number;
  name: string;
  quality: number;
  requiredLevel: number;
  sellPrice: number;
  speed: number;
  stackable: number;
  stats: {
    type: number;
    value: number;
  }[];
  subclassId: number;
}
