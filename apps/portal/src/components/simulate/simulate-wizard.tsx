"use client";

import { useIntlayer } from "next-intlayer";
import { useMemo } from "react";
import { Stack } from "styled-system/jsx";

import { Steps } from "@/components/ui";
import { selectProfile, useCharacterInput } from "@/lib/sim";

import { ConfigureStep, ImportStep, ResultsStep } from "./steps";

type StepValue = "import" | "configure" | "results";

export function SimulateWizard() {
  const { wizard: content } = useIntlayer("simulate");
  const profile = useCharacterInput(selectProfile);
  const clearCharacter = useCharacterInput((s) => s.clearCharacter);

  const steps = useMemo(
    () => [
      {
        autoAdvanceTo: () => (profile ? ("configure" as const) : null),
        label: content.import,
        value: "import" as const,
      },
      {
        canUnlock: () => !!profile,
        label: content.configure,
        value: "configure" as const,
      },
      {
        canUnlock: () => !!profile,
        label: content.results,
        value: "results" as const,
      },
    ],
    [content, profile],
  );

  const wizard = Steps.useStepsState<StepValue>({
    initialValue: "import",
    onStepChange: (from, to) => {
      if (to === "import" && profile) {
        clearCharacter();
      }
    },
    steps,
  });

  return (
    <Stack gap="6">
      <Steps.Root {...wizard.rootProps}>
        <Steps.List />

        <Steps.Content value="import">
          <Stack pt="6">
            <ImportStep />
          </Stack>
        </Steps.Content>

        <Steps.Content value="configure">
          <Stack pt="6">
            {profile && (
              <ConfigureStep
                profile={profile}
                onSimulate={() => wizard.goTo("results")}
                onClear={() => {
                  clearCharacter();
                  wizard.reset();
                }}
              />
            )}
          </Stack>
        </Steps.Content>

        <Steps.Content value="results">
          <Stack pt="6">
            <ResultsStep />
          </Stack>
        </Steps.Content>
      </Steps.Root>
    </Stack>
  );
}
