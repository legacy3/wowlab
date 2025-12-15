import { daemonCommand } from "./daemon/index.js";
import { dumpTalentTreeCommand } from "./dump-talent-tree/index.js";
import { runCommand } from "./run/index.js";
import { specCoverageCommand } from "./spec-coverage/index.js";

export const commands = [
  runCommand,
  daemonCommand,
  specCoverageCommand,
  dumpTalentTreeCommand,
] as const;
