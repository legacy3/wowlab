export interface CliOptions {
  batch: number;
  clear: boolean;
  dryRun: boolean;
  items: string;
}

export interface ItemDataFlat {
  id: number;
  name: string;
  quality: number;
  inventoryType: number;
  itemLevel: number;
  requiredLevel: number;
  classId: number;
  subclassId: number;
}
