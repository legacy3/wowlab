import { daemonCommand } from "./daemon/index.js";
import { runCommand } from "./run/index.js";
import { specCoverageCommand } from "./spec-coverage/index.js";

export const commands = [runCommand, daemonCommand, specCoverageCommand] as const;
