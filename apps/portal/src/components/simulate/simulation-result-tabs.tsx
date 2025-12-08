"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";

import { UrlTabs } from "@/components/ui/url-tabs";
import { ResultsOverview } from "./results-overview";
import { TimelineContent } from "@/components/simulate/results/timeline";
import { ChartsContent } from "@/components/simulate/results/charts";
import { EventLogContent } from "@/components/simulate/results/event-log";
import { jobsAtom } from "@/atoms/computing";
import { combatDataAtom, timelineBoundsAtom } from "@/atoms/timeline";
import { transformEventsWithResources } from "@/lib/simulation/transformers";
import type { SimulationEvent } from "@/lib/simulation/types";

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

    // Events are CombatLogEvents with _tag discriminator (possibly mixed with ResourceSnapshots)
    const events = job.result.events as SimulationEvent[];

    const durationMs = job.result.durationMs;
    const durationSec = durationMs / 1000;

    // Transform using the proper event transformer
    const combatData = transformEventsWithResources(events, durationMs);

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
        {
          value: "events",
          label: "Event Log",
          content: <EventLogContent />,
        },
      ]}
    />
  );
}
