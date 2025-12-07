"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";

import { UrlTabs } from "@/components/ui/url-tabs";
import { ResultsOverview } from "./results-overview";
import { TimelineContent } from "@/components/simulate/results/timeline";
import { ChartsContent } from "@/components/simulate/results/charts";
import { jobsAtom } from "@/atoms/computing";
import {
  combatDataAtom,
  timelineBoundsAtom,
  type CombatData,
} from "@/atoms/timeline";

function useLoadLocalJob() {
  const params = useParams();
  const jobId = params?.id as string | undefined;
  const jobs = useAtomValue(jobsAtom);
  const setCombatData = useSetAtom(combatDataAtom);
  const setBounds = useSetAtom(timelineBoundsAtom);

  useEffect(() => {
    if (!jobId) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job?.result?.events) return;

    // Transform simulation events to timeline format
    const events = job.result.events as Array<{
      type: string;
      timestamp: number;
      spellId?: number;
      damage?: number;
      isCrit?: boolean;
      focus?: number;
    }>;

    const durationSec = job.result.durationMs / 1000;
    let idx = 0;
    const id = () => `evt-${idx++}`;

    const casts: CombatData["casts"] = [];
    const damage: CombatData["damage"] = [];
    const resources: CombatData["resources"] = [];
    const buffs: CombatData["buffs"] = [];

    for (const evt of events) {
      if (evt.type === "cast" && evt.spellId) {
        casts.push({
          type: "cast",
          id: id(),
          spellId: evt.spellId,
          timestamp: evt.timestamp,
          duration: 0,
          target: "Target",
          successful: true,
        });
      }

      if (evt.type === "damage" && evt.spellId && evt.damage) {
        damage.push({
          type: "damage",
          id: id(),
          spellId: evt.spellId,
          timestamp: evt.timestamp,
          amount: evt.damage,
          isCrit: evt.isCrit ?? false,
          target: "Target",
        });
      }

      if (evt.type === "resource" && evt.focus !== undefined) {
        resources.push({
          type: "resource",
          id: id(),
          timestamp: evt.timestamp,
          focus: evt.focus,
          maxFocus: 120,
        });
      }
    }

    const combatData: CombatData = {
      casts,
      damage,
      resources,
      buffs,
      phases: [
        {
          type: "phase",
          id: "p1",
          name: "Combat",
          start: 0,
          end: durationSec,
          color: "#3B82F6",
        },
      ],
    };

    setCombatData(combatData);
    setBounds({ min: 0, max: durationSec });
  }, [jobId, jobs, setCombatData, setBounds]);
}

export function SimulationResultTabs() {
  useLoadLocalJob();

  return (
    <UrlTabs
      defaultTab="timeline"
      tabs={[
        {
          value: "overview",
          label: "Overview",
          content: <ResultsOverview />,
        },
        {
          value: "timeline",
          label: "Timeline",
          content: <TimelineContent />,
        },
        {
          value: "charts",
          label: "Charts",
          content: <ChartsContent />,
        },
      ]}
    />
  );
}
