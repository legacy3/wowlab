import * as Dbc from "@packages/innocent-schemas/Dbc";
import * as path from "node:path";

export const REPO_ROOT = path.join(process.cwd(), "../..");
export const DBC_DATA_DIR = path.join(
  REPO_ROOT,
  "third_party/wow-gamedata/data",
);

export const DBC_TABLE_CONFIG = [
  {
    file: "Item.json",
    key: "item",
    type: {} as Dbc.ItemRow,
  },
  {
    file: "ItemSparse.json",
    key: "itemSparse",
    type: {} as Dbc.ItemSparseRow,
  },
  {
    file: "FileData.json",
    key: "fileData",
    type: {} as Dbc.FileDataRow,
  },
  {
    file: "ItemEffect.json",
    key: "itemEffect",
    type: {} as Dbc.ItemEffectRow,
  },
  {
    file: "ItemXItemEffect.json",
    key: "itemXItemEffect",
    type: {} as Dbc.ItemXItemEffectRow,
  },
] as const;
