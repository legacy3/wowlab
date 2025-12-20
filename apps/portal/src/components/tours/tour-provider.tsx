"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import Joyride, {
  STATUS,
  ACTIONS,
  type CallBackProps,
  type Step,
} from "react-joyride";
import { completedToursAtom, type TourId } from "@/atoms/tours";
import { TourTooltip } from "./tour-tooltip";

export interface TourConfig {
  id: TourId;
  steps: Step[];
}

interface TourRunnerProps {
  tour: TourConfig;
  run: boolean;
  onComplete?: () => void;
}

export function TourRunner({ tour, run, onComplete }: TourRunnerProps) {
  const [completedTours, setCompletedTours] = useAtom(completedToursAtom);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action } = data;

      const isFinished =
        status === STATUS.FINISHED || status === STATUS.SKIPPED;
      const isClosed = action === ACTIONS.CLOSE;

      if (isFinished || isClosed) {
        if (!completedTours.includes(tour.id)) {
          setCompletedTours((prev) => [...prev, tour.id]);
        }

        onComplete?.();
      }
    },
    [completedTours, setCompletedTours, tour.id, onComplete],
  );

  const isCompleted = completedTours.includes(tour.id);
  if (isCompleted) {
    return null;
  }

  return (
    <Joyride
      steps={tour.steps}
      run={run}
      continuous
      disableOverlayClose
      scrollToFirstStep
      spotlightClicks
      spotlightPadding={8}
      callback={handleCallback}
      tooltipComponent={TourTooltip}
      floaterProps={{
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.75)",
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
    />
  );
}

export function useTourCompleted(tourId: TourId): boolean {
  const [completedTours] = useAtom(completedToursAtom);

  return completedTours.includes(tourId);
}

export function useResetTour() {
  const [, setCompletedTours] = useAtom(completedToursAtom);

  return useCallback(
    (tourId: TourId) => {
      setCompletedTours((prev) => prev.filter((id) => id !== tourId));
    },
    [setCompletedTours],
  );
}
