import { createPersistedOrderAtom } from "../utils";

export type SettingsCardId = "profile-settings" | "simulation-settings";

export const settingsCardOrderAtom = createPersistedOrderAtom<SettingsCardId>(
  "settings-card-order-v2",
  ["profile-settings", "simulation-settings"],
);
