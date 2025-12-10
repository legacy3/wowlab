import * as Schema from "effect/Schema";

export const TraitDefinitionRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  OverrideDescription_lang: Schema.NullOr(Schema.String),
  OverrideIcon: Schema.NumberFromString,
  OverrideName_lang: Schema.NullOr(Schema.String),
  OverridesSpellID: Schema.NumberFromString,
  OverrideSubtext_lang: Schema.NullOr(Schema.String),
  SpellID: Schema.NumberFromString,
  VisibleSpellID: Schema.NumberFromString,
});

export type TraitDefinitionRow = Schema.Schema.Type<
  typeof TraitDefinitionRowSchema
>;
