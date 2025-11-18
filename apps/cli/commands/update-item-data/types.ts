import type { ItemDataFlat } from "@packages/innocent-schemas/Item";

export interface CliOptions {
  batch: number;
  clear: boolean;
  dryRun: boolean;
  items: string;
}

// Re-export ItemDataFlat for CLI use
export type { ItemDataFlat };
