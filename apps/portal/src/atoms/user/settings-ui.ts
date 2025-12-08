import { createPersistedOrderAtom } from "../utils";

export type SettingsCardId = "profile-settings" | "simulation-settings";

export const settingsCardOrderAtom = createPersistedOrderAtom<SettingsCardId>(
  "settings-card-order",
  ["profile-settings", "simulation-settings"],
);
