import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Spell } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";
import {
  transformSpellWith,
  type SpellKnowledgeContext,
} from "./spell-impl.js";

export const transformSpell = (
  spellId: number,
  knowledgeContext?: SpellKnowledgeContext,
): Effect.Effect<
  Spell.SpellDataFlat,
  Errors.SpellInfoNotFound | DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;
    return yield* transformSpellWith(dbc, extractor, spellId, knowledgeContext);
  });
