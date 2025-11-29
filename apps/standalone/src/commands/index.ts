import { daemonCommand } from "./daemon/index.js";
import { runCommand } from "./run/index.js";

export const commands = [runCommand, daemonCommand] as const;
