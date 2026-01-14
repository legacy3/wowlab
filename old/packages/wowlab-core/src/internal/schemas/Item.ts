import * as Schema from "effect/Schema";

export const ItemStatSchema = Schema.Struct({
  type: Schema.Number,
  value: Schema.Number,
});

export const ItemEffectSchema = Schema.Struct({
  categoryCooldown: Schema.Number,
  charges: Schema.Number,
  cooldown: Schema.Number,
  spellId: Schema.Number,
  triggerType: Schema.Number,
});

export const ItemClassificationSchema = Schema.Struct({
  classId: Schema.Number,
  className: Schema.String,
  expansionId: Schema.Number,
  expansionName: Schema.String,
  inventoryType: Schema.Number,
  inventoryTypeName: Schema.String,
  subclassId: Schema.Number,
  subclassName: Schema.String,
});

export const ItemDropSourceSchema = Schema.Struct({
  difficultyMask: Schema.Number,
  encounterId: Schema.Number,
  encounterName: Schema.String,
  instanceId: Schema.Number,
  instanceName: Schema.String,
});

export const ItemSetSpellInfoSchema = Schema.Struct({
  specId: Schema.Number,
  spellId: Schema.Number,
  threshold: Schema.Number,
});

export const ItemSetInfoSchema = Schema.Struct({
  bonuses: Schema.Array(ItemSetSpellInfoSchema),
  itemIds: Schema.Array(Schema.Number),
  setId: Schema.Number,
  setName: Schema.String,
});

export const ItemDataFlatSchema = Schema.Struct({
  // Basic info
  binding: Schema.Number,
  buyPrice: Schema.Number,
  description: Schema.String,
  fileName: Schema.String,
  id: Schema.Number,
  itemLevel: Schema.Number,
  maxCount: Schema.Number,
  name: Schema.String,
  quality: Schema.Number,
  requiredLevel: Schema.Number,
  sellPrice: Schema.Number,
  speed: Schema.Number,
  stackable: Schema.Number,

  // Classification
  classId: Schema.Number,
  classification: Schema.NullOr(ItemClassificationSchema),
  inventoryType: Schema.Number,
  subclassId: Schema.Number,

  // Stats & Effects
  effects: Schema.Array(ItemEffectSchema),
  stats: Schema.Array(ItemStatSchema),

  // Sockets
  socketBonusEnchantId: Schema.Number,
  sockets: Schema.Array(Schema.Number), // SocketType_0-2 values

  // Flags (5 flag fields)
  flags: Schema.Array(Schema.Number),

  // Class/Race restrictions
  allowableClass: Schema.Number, // -1 = all, otherwise bitmask
  allowableRace: Schema.Number,

  // Expansion & Set
  expansionId: Schema.Number,
  itemSetId: Schema.Number,
  setInfo: Schema.NullOr(ItemSetInfoSchema),

  // Drop sources
  dropSources: Schema.Array(ItemDropSourceSchema),

  // Gem/Crafting
  dmgVariance: Schema.Number,
  gemProperties: Schema.Number,
  modifiedCraftingReagentItemId: Schema.Number,
});

export type ItemDataFlat = Schema.Schema.Type<typeof ItemDataFlatSchema>;
