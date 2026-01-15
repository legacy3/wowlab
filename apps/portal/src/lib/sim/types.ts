import type { Profile } from "parsers";

export type {
  Character,
  Item,
  Loadout,
  Profession,
  Profile,
  Slot,
  Talents,
  WowClass,
} from "parsers";

export type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; profile: Profile }
  | { status: "error"; error: string };

export interface RecentProfile {
  profile: Profile;
  simc: string;
}
