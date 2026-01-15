"use client";

import { useExtracted } from "next-intl";
import { Stack } from "styled-system/jsx";

import { Button, Steps, Text } from "@/components/ui";

export function ResultsStep() {
  const t = useExtracted();
  const { goBack } = Steps.useSteps();

  return (
    <Stack gap="6">
      <Stack gap="2" p="8" bg="bg.subtle" borderRadius="lg" align="center">
        <Text fontWeight="medium" textStyle="lg">
          {t("Simulation Results")}
        </Text>
        <Text textStyle="sm" color="fg.muted">
          {t("Work in progress...")}
        </Text>
      </Stack>

      <Button variant="outline" onClick={goBack} alignSelf="start">
        {t("Back")}
      </Button>
    </Stack>
  );
}
