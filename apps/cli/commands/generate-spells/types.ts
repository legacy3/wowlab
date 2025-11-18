import type * as Branded from "@packages/innocent-schemas/Branded";

import * as Schema from "effect/Schema";

export interface SpecSpellMap {
  readonly classId: string;
  readonly className: string;
  readonly classSlug: string;
  readonly specId: string;
  readonly specName: string;
  readonly specSlug: string;
  readonly spells: ReadonlyArray<SpellEntry>;
}

export interface SpellEntry {
  readonly name: string;
  readonly normalizedName: string;
  readonly spellId: Branded.SpellID;
}

export const RaidbotsTalentsSchema = Schema.Array(
  Schema.Struct({
    className: Schema.String,
    classNodes: Schema.Array(
      Schema.Struct({
        entries: Schema.Array(
          Schema.Union(
            Schema.Struct({
              name: Schema.String,
              spellId: Schema.optional(Schema.Number),
            }),
            Schema.Struct({
              name: Schema.String,
            }),
          ),
        ),
      }),
    ),
    heroNodes: Schema.Array(
      Schema.Struct({
        entries: Schema.Array(
          Schema.Union(
            Schema.Struct({
              name: Schema.String,
              spellId: Schema.optional(Schema.Number),
            }),
            Schema.Struct({
              name: Schema.String,
            }),
          ),
        ),
      }),
    ),
    specName: Schema.String,
    specNodes: Schema.Array(
      Schema.Struct({
        entries: Schema.Array(
          Schema.Union(
            Schema.Struct({
              name: Schema.String,
              spellId: Schema.optional(Schema.Number),
            }),
            Schema.Struct({
              name: Schema.String,
            }),
          ),
        ),
      }),
    ),
  }),
);
