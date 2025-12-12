export const GAME_CONFIG = {
  patchVersion: "11.2.5",
  expansionId: 10,
  expansionName: "The War Within",
  mythicPlusSeasonId: 13,
  seasonName: "Season 3",
} as const;

export type GameConfig = typeof GAME_CONFIG;
