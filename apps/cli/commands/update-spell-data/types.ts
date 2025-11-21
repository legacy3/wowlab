export interface CliOptions {
  batch: number;
  clear: boolean;
  dryRun: boolean;
  spells: string;
}

export interface SpellDataFlat {
  id: number;
  name: string;
  iconName: string;
  castTime: number;
  cooldown: number;
  gcd: number;
}
