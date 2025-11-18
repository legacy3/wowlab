export const EQUIPMENT_SLOTS = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "wrist",
  "hands",
  "waist",
  "legs",
  "feet",
  "finger1",
  "finger2",
  "trinket1",
  "trinket2",
  "mainHand",
  "offHand",
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export const EQUIPMENT_LEFT_COLUMN: ReadonlyArray<EquipmentSlot> = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "wrist",
];

export const EQUIPMENT_RIGHT_COLUMN: ReadonlyArray<EquipmentSlot> = [
  "hands",
  "waist",
  "legs",
  "feet",
  "finger1",
  "finger2",
];

export const EQUIPMENT_TRINKET_SLOTS: ReadonlyArray<EquipmentSlot> = [
  "trinket1",
  "trinket2",
];

export const EQUIPMENT_WEAPON_SLOTS: ReadonlyArray<EquipmentSlot> = [
  "mainHand",
  "offHand",
];
