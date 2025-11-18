import * as Schema from "effect/Schema";

import * as Branded from "@/Branded";

const SpellInterruptsSchema = Schema.Struct({
  AuraInterruptFlags: Schema.Array(Schema.Number),
  ChannelInterruptFlags: Schema.Array(Schema.Number),
  ID: Schema.Number,
  InterruptFlags: Schema.Number,
  SpellID: Branded.SpellIDSchema,
});

type SpellInterruptsRow = Schema.Schema.Type<typeof SpellInterruptsSchema>;

export { SpellInterruptsSchema, type SpellInterruptsRow };
