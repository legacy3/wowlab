import type { ItemQuality } from "./item-quality";

export interface WowItem {
  id: number;
  name: string;
  iconName: string;
  quality: ItemQuality;
  slot: string;
  itemLevel: number;
  description: string;
  stats: string[];
}
