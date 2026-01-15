import type { Profile } from "@/lib/engine";

export type {
  Character,
  Item,
  Loadout,
  Profession,
  Profile,
  Slot,
  Talents,
  WowClass,
} from "@/lib/engine";

export type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; profile: Profile }
  | { status: "error"; error: string };

export interface RecentProfile {
  profile: Profile;
  simc: string;
}
