import { cpuProfileCommand } from "./cpu-profile.js";
import { daemonCommand } from "./daemon/index.js";
import { debugLoadoutCommand } from "./debug-loadout/index.js";
import { dumpTalentTreeCommand } from "./dump-talent-tree/index.js";
import { profileCommand } from "./profile.js";
import { runCommand } from "./run/index.js";
import { specCoverageCommand } from "./spec-coverage/index.js";
import { testWasmCommand } from "./test-wasm.js";

export const commands = [
  runCommand,
  profileCommand,
  cpuProfileCommand,
  testWasmCommand,
  daemonCommand,
  specCoverageCommand,
  dumpTalentTreeCommand,
  debugLoadoutCommand,
] as const;
