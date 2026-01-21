"use client";

import { useIntlayer } from "next-intlayer";
import { Stack } from "styled-system/jsx";

import { Button, Steps, Text } from "@/components/ui";

export function ResultsStep() {
  const { resultsStep: content } = useIntlayer("simulate");
  const { goBack } = Steps.useSteps();

  return (
    <Stack gap="6">
      <Stack gap="2" p="8" bg="bg.subtle" borderRadius="lg" align="center">
        <Text fontWeight="medium" textStyle="lg">
          {content.simulationResults}
        </Text>
        <Text textStyle="sm" color="fg.muted">
          {content.workInProgress}
        </Text>
      </Stack>

      <Button variant="outline" onClick={goBack} alignSelf="start">
        {content.back}
      </Button>
    </Stack>
  );
}
