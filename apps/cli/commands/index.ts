import { generateEnumsCommand } from "./generate-enums/index.js";
import { generateSpellsCommand } from "./generate-spells/index.js";
import { helloWorldCommand } from "./hello-world/index.js";
import { killCommand } from "./kill/index.js";

export const commands = [
  generateEnumsCommand,
  generateSpellsCommand,
  helloWorldCommand,
  killCommand,
] as const;
