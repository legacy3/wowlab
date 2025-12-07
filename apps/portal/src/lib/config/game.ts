export const GAME_CONFIG = {
  patchVersion: "11.0.2",
  expansionId: 10,
  mythicPlusSeasonId: 13,
} as const;

export type GameConfig = typeof GAME_CONFIG;
