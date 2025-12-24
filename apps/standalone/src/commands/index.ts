import { daemonCommand } from "./daemon/index.js";
import { debugLoadoutCommand } from "./debug-loadout/index.js";
import { dumpTalentTreeCommand } from "./dump-talent-tree/index.js";
import { profileCommand } from "./profile.js";
import { runCommand } from "./run/index.js";
import { specCoverageCommand } from "./spec-coverage/index.js";

export const commands = [
  runCommand,
  profileCommand,
  daemonCommand,
  specCoverageCommand,
  dumpTalentTreeCommand,
  debugLoadoutCommand,
] as const;
