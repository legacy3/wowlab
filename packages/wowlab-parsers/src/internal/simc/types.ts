export interface SimcCharacter {
  readonly level: number;
  readonly name: string;
  readonly professions: readonly SimcProfession[];
  readonly race: string;
  readonly region?: string;
  readonly role?: string;
  readonly server?: string;
  readonly spec?: string;
  readonly wowClass: WowClass;
}

export interface SimcItem {
  readonly bonusIds?: readonly number[];
  readonly craftedStats?: readonly number[];
  readonly craftingQuality?: number;
  readonly enchantId?: number;
  readonly gemIds?: readonly number[];
  readonly id: number;
  readonly slot: SimcSlot;
}

export interface SimcProfession {
  readonly name: string;
  readonly rank: number;
}

export interface SimcProfile {
  readonly character: SimcCharacter;
  readonly equipment: readonly SimcItem[];
  readonly rawAssignments: ReadonlyMap<string, string>;
  readonly talents: SimcTalents;
}

export interface SimcSavedLoadout {
  readonly encoded: string;
  readonly name: string;
}

export type SimcSlot =
  | "head"
  | "neck"
  | "shoulder"
  | "back"
  | "chest"
  | "wrist"
  | "hands"
  | "waist"
  | "legs"
  | "feet"
  | "finger1"
  | "finger2"
  | "trinket1"
  | "trinket2"
  | "main_hand"
  | "off_hand";

export interface SimcTalents {
  readonly encoded: string;
  readonly savedLoadouts?: readonly SimcSavedLoadout[];
}

export type WowClass =
  | "death_knight"
  | "demon_hunter"
  | "druid"
  | "evoker"
  | "hunter"
  | "mage"
  | "monk"
  | "paladin"
  | "priest"
  | "rogue"
  | "shaman"
  | "warlock"
  | "warrior";
