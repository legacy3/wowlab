import * as Schema from "effect/Schema";

import { GearItemSchema } from "./GearItemSchema";

const ProfessionSchema = Schema.Struct({
  name: Schema.String,
  rank: Schema.Number,
});

export const CharacterProfileSchema = Schema.Struct({
  // Metadata
  class: Schema.String,
  level: Schema.Number,
  name: Schema.String,
  race: Schema.String,
  region: Schema.String,
  role: Schema.String,
  server: Schema.String,
  spec: Schema.String,

  // Talents (encoded string - not decoded yet)
  talents: Schema.String,

  // Professions
  professions: Schema.optional(Schema.Array(ProfessionSchema)),

  // Gear (16 slots)
  gear: Schema.Record({
    key: Schema.Literal(
      "head",
      "neck",
      "shoulder",
      "back",
      "chest",
      "tabard",
      "wrist",
      "hands",
      "waist",
      "legs",
      "feet",
      "finger1",
      "finger2",
      "trinket1",
      "trinket2",
      "main_hand",
      "off_hand",
    ),
    value: GearItemSchema,
  }),
});

export type CharacterProfile = Schema.Schema.Type<
  typeof CharacterProfileSchema
>;
