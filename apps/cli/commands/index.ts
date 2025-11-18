import { generateEnumsCommand } from "./generate-enums/index.js";
import { generateSpellsCommand } from "./generate-spells/index.js";
import { helloWorldCommand } from "./hello-world/index.js";
import { killCommand } from "./kill/index.js";
import { updateItemDataCommand } from "./update-item-data/index.js";
import { updateSpellDataCommand } from "./update-spell-data/index.js";

export const commands = [
  generateEnumsCommand,
  generateSpellsCommand,
  helloWorldCommand,
  killCommand,
  updateItemDataCommand,
  updateSpellDataCommand,
] as const;
