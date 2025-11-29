import * as Schema from "effect/Schema";

export const SpellClassOptionsRowSchema = Schema.Struct({
  ID: Schema.Number,
  ModalNextSpell: Schema.Number,
  SpellClassMask_0: Schema.Number,
  SpellClassMask_1: Schema.Number,
  SpellClassMask_2: Schema.Number,
  SpellClassMask_3: Schema.Number,
  SpellClassSet: Schema.Number,
  SpellID: Schema.Number,
});

export type SpellClassOptionsRow = Schema.Schema.Type<
  typeof SpellClassOptionsRowSchema
>;
