import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import { createClient } from "@/lib/supabase/client";

export type TrendDirection = "up" | "down" | "flat";

export type WowClass =
  | "Death Knight"
  | "Druid"
  | "Hunter"
  | "Mage"
  | "Paladin"
  | "Priest"
  | "Rogue"
  | "Shaman"
  | "Warlock"
  | "Warrior";

export interface SpecRanking {
  readonly rank: number;
  readonly spec: string;
  readonly wowClass: WowClass;
  readonly dps: number;
  readonly changePercent: number;
  readonly direction: TrendDirection;
  readonly sampleSize: number;
}

export interface WantedItem {
  readonly rank: number;
  readonly id: number;
  readonly name: string;
  readonly slot: string;
  readonly itemLevel: number;
  readonly classes: readonly WowClass[];
  readonly dpsGain: number;
  readonly source: string;
  readonly quality: number;
}

export interface CharacterSim {
  readonly id: number;
  readonly character: string;
  readonly spec: string;
  readonly wowClass: WowClass;
  readonly dps: number;
  readonly percentile: number;
  readonly realm: string;
  readonly region: string;
  readonly gearscore: number;
  readonly runDate: string;
  readonly reportUrl: string;
}

export const selectedTierAtom = atom<string>("sunwell");
export const selectedFightLengthAtom = atom<string>("patchwerk");
export const selectedTimeWindowAtom = atom<string>("7d");

export const specRankingsAtom = atomWithRefresh(async () => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("spec_rankings_hourly")
    .select("*")
    .order("avg_dps", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row, index): SpecRanking => ({
      rank: index + 1,
      spec: row.spec!,
      wowClass: row.class! as WowClass,
      dps: Math.round(row.avg_dps!),
      // TODO: Calculate trend from historical data when available
      changePercent: 0,
      direction: "flat",
      sampleSize: Number(row.sim_count),
    }),
  );
});


export const topSimCharactersAtom = atomWithRefresh(async () => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("top_sims_daily")
    .select("*")
    .limit(10);

  if (error) {
    throw error;
  }

  // Transform database rows to UI format
  return (data ?? []).map(
    (row, index): CharacterSim => ({
      id: index + 1,
      character: row.rotation_name!,
      spec: row.spec!,
      wowClass: row.class! as WowClass,
      dps: Math.round(row.dps!),
      // TODO: Calculate percentile from rank when we have more data
      percentile: 99 - index, // Rough estimate based on rank
      // TODO: Add realm/region when user profiles include this data
      realm: "N/A",
      region: "N/A",
      // TODO: Add gearscore when gear tracking is implemented
      gearscore: 0,
      runDate: new Date(row.sim_date!).toISOString().split("T")[0],
      // TODO: Link to actual sim result page
      reportUrl: `#/sim/${row.id}`,
    }),
  );
});

export const CLASS_COLORS: Record<WowClass, string> = {
  "Death Knight": "#C41E3A",
  Druid: "#FF7D0A",
  Hunter: "#ABD473",
  Mage: "#69CCF0",
  Paladin: "#F58CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF569",
  Shaman: "#0070DE",
  Warlock: "#9482C9",
  Warrior: "#C79C6E",
};

export const RAID_TIERS = [
  { label: "Sunwell Plateau (T6)", value: "sunwell" },
  { label: "Black Temple (T6)", value: "bt" },
  { label: "Serpentshrine Cavern (T5)", value: "ssc" },
] as const;

export const FIGHT_LENGTHS = [
  { label: "5 min Patchwerk", value: "patchwerk" },
  { label: "3 min Burn", value: "burn" },
  { label: "7 min Marathon", value: "marathon" },
] as const;

export const TIME_WINDOWS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
] as const;
