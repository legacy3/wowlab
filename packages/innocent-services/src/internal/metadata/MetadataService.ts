import * as Errors from "@packages/innocent-domain/Errors";
import * as Item from "@packages/innocent-schemas/Item";
import * as Spell from "@packages/innocent-schemas/Spell";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export class MetadataService extends Context.Tag("MetadataService")<
  MetadataService,
  {
    readonly loadSpell: (
      spellId: number,
    ) => Effect.Effect<
      Spell.SpellDataFlat,
      Errors.Data | Errors.SpellInfoNotFound
    >;

    readonly loadItem: (
      itemId: number,
    ) => Effect.Effect<Item.ItemDataFlat, Errors.Data | Errors.ItemNotFound>;
  }
>() {}
