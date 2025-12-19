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
  subclassId: Schema.Number,
  subclassName: Schema.String,
  inventoryType: Schema.Number,
  inventoryTypeName: Schema.String,
  expansionId: Schema.Number,
  expansionName: Schema.String,
});

export const ItemDropSourceSchema = Schema.Struct({
  encounterId: Schema.Number,
  encounterName: Schema.String,
  instanceId: Schema.Number,
  instanceName: Schema.String,
  difficultyMask: Schema.Number,
});

export const ItemSetSpellInfoSchema = Schema.Struct({
  spellId: Schema.Number,
  threshold: Schema.Number,
  specId: Schema.Number,
});

export const ItemSetInfoSchema = Schema.Struct({
  setId: Schema.Number,
  setName: Schema.String,
  itemIds: Schema.Array(Schema.Number),
  bonuses: Schema.Array(ItemSetSpellInfoSchema),
});

export const ItemDataFlatSchema = Schema.Struct({
  // Basic info
  id: Schema.Number,
  name: Schema.String,
  description: Schema.String,
  fileName: Schema.String,
  quality: Schema.Number,
  itemLevel: Schema.Number,
  requiredLevel: Schema.Number,
  binding: Schema.Number,
  buyPrice: Schema.Number,
  sellPrice: Schema.Number,
  maxCount: Schema.Number,
  stackable: Schema.Number,
  speed: Schema.Number,

  // Classification
  classId: Schema.Number,
  subclassId: Schema.Number,
  inventoryType: Schema.Number,
  classification: Schema.NullOr(ItemClassificationSchema),

  // Stats & Effects
  stats: Schema.Array(ItemStatSchema),
  effects: Schema.Array(ItemEffectSchema),

  // Sockets
  sockets: Schema.Array(Schema.Number), // SocketType_0-2 values
  socketBonusEnchantId: Schema.Number,

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
  gemProperties: Schema.Number,
  modifiedCraftingReagentItemId: Schema.Number,
  dmgVariance: Schema.Number,
});

export type ItemDataFlat = Schema.Schema.Type<typeof ItemDataFlatSchema>;
