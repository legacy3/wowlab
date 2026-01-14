import * as Schema from "effect/Schema";

export const GlobalColorRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  LuaConstantName: Schema.String,
  Color: Schema.NumberFromString,
});

export type GlobalColorRow = Schema.Schema.Type<typeof GlobalColorRowSchema>;
