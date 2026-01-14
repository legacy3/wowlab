import type { DbcRow, DbcTableName } from "@wowlab/core/DbcTableRegistry";

import { DbcError } from "@wowlab/core/Errors";
import * as Request from "effect/Request";

export class GetDbcById<
  Table extends DbcTableName = DbcTableName,
> extends Request.TaggedClass("GetDbcById")<
  DbcRow<Table> | undefined,
  DbcError,
  { readonly table: Table; readonly id: number }
> {}

export class GetDbcManyByFk<
  Table extends DbcTableName = DbcTableName,
> extends Request.TaggedClass("GetDbcManyByFk")<
  ReadonlyArray<DbcRow<Table>>,
  DbcError,
  {
    readonly table: Table;
    readonly fkField: keyof DbcRow<Table> & string;
    readonly fkValue: number;
  }
> {}

export class GetDbcOneByFk<
  Table extends DbcTableName = DbcTableName,
> extends Request.TaggedClass("GetDbcOneByFk")<
  DbcRow<Table> | undefined,
  DbcError,
  {
    readonly table: Table;
    readonly fkField: keyof DbcRow<Table> & string;
    readonly fkValue: number;
  }
> {}
