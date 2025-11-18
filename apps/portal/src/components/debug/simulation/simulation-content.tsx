"use client";

import { useState } from "react";
// import { useAtom } from "jotai";
// import {
//   runSimulationAtom,
//   simulationEventsAtom,
//   simulationSnapshotCountAtom,
//   simulationLogsAtom,
//   simulationOrderAtom,
//   type SimulationCardId,
// } from "@/atoms/debug";
import { useSerializedError } from "@/hooks/use-serialized-error";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  ControlsCard,
  ResultCard,
  ErrorCard,
  LogsCard,
  EventsCard,
} from "./cards";

type SimulationCardId = "controls" | "result" | "error" | "logs" | "events";

export function SimulationContent() {
  const [isRunning, setIsRunning] = useState(false);
  const { error, setSerializedError, clearError } = useSerializedError();
  // const [events] = useAtom(simulationEventsAtom);
  // const [snapshotCount] = useAtom(simulationSnapshotCountAtom);
  // const [logs] = useAtom(simulationLogsAtom);
  // const [order, setOrder] = useAtom(simulationOrderAtom);
  // const [, runSimulation] = useAtom(runSimulationAtom);

  const events: any[] = [];
  const snapshotCount = 0;
  const logs: string[] = [];
  const order: SimulationCardId[] = [
    "controls",
    "result",
    "error",
    "logs",
    "events",
  ];
  const setOrder = () => {};

  const handleRunSimulation = async () => {
    setIsRunning(true);
    clearError();

    try {
      // await runSimulation();
      console.log("Simulation temporarily disabled");
    } catch (err) {
      setSerializedError(err);
      console.error("Simulation error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const resultMessage =
    snapshotCount > 0 && events.length > 0
      ? `Simulation completed successfully! Snapshots: ${snapshotCount}, Events: ${events.length}`
      : null;

  const components: DashboardConfig<SimulationCardId> = {
    controls: {
      Component: () => (
        <ControlsCard isRunning={isRunning} onRun={handleRunSimulation} />
      ),
    },
    result: {
      Component: () => <ResultCard result={resultMessage} />,
    },
    error: {
      Component: () => <ErrorCard error={error} />,
    },
    logs: {
      Component: () => <LogsCard logs={logs} />,
    },
    events: {
      Component: () => <EventsCard events={events} />,
      className: "md:col-span-2",
    },
  };

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:grid-cols-2 md:auto-rows-min"
    />
  );
}
