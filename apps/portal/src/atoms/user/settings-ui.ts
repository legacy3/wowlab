import { atomWithStorage } from "jotai/utils";

export type SettingsCardId = "profile-settings" | "simulation-settings";

export const settingsCardOrderAtom = atomWithStorage<readonly SettingsCardId[]>(
  "settings-card-order",
  ["profile-settings", "simulation-settings"],
);
