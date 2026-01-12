import { DbcError, DbcQueryError } from "@wowlab/core/Errors";
import type { Spec } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";

export const transformSpec = (
  id: number,
): Effect.Effect<Spec.SpecDataFlat, DbcError, DbcService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const row = yield* dbc.getById("chr_specialization", id);

    if (!row) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Spec ${id} not found` }),
      );
    }

    return {
      classId: row.ClassID,
      description: row.Description_lang ?? "",
      iconFileId: row.SpellIconFileID,
      id: row.ID,
      masterySpellIds: [row.MasterySpellID_0, row.MasterySpellID_1] as const,
      name: row.Name_lang ?? "",
      orderIndex: row.OrderIndex,
      role: row.Role,
    };
  });
