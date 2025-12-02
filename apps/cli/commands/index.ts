import { changelogCommand } from "./changelog/index.js";
import { generateEnumsCommand } from "./generate-enums/index.js";
import { generateSpellsCommand } from "./generate-spells/index.js";
import { helloWorldCommand } from "./hello-world/index.js";
import { killCommand } from "./kill/index.js";
import { uploadDbcCommand } from "./upload-dbc/index.js";

export const commands = [
  changelogCommand,
  generateEnumsCommand,
  generateSpellsCommand,
  helloWorldCommand,
  killCommand,
  uploadDbcCommand,
] as const;
