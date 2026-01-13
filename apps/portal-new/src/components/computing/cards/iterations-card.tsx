"use client";

import { Activity } from "lucide-react";
import { useExtracted } from "next-intl";
import { Box, HStack, Stack } from "styled-system/jsx";

import { Card, InlineLoader, Text } from "@/components/ui";
import { useJobs, useWorkerSystem } from "@/lib/state";
import { formatCompact } from "@/lib/utils";

export function IterationsCard() {
  const t = useExtracted();
  const totalIterations = useWorkerSystem((s) => s.totalIterationsRun);
  const runningJob = useJobs((s) => s.jobs.find((j) => j.status === "running"));

  return (
    <Card.Root h="full">
      <Card.Body
        p="4"
        display="flex"
        flexDir="column"
        alignItems="center"
        textAlign="center"
      >
        <HStack gap="2" color="fg.muted">
          {runningJob ? (
            <InlineLoader variant="processing" />
          ) : (
            <Activity style={{ height: 14, width: 14 }} />
          )}
          <Text textStyle="xs">{t("Iterations")}</Text>
        </HStack>
        {runningJob ? (
          <Stack mt="1" gap="1.5" w="full">
            <HStack
              justifyContent="space-between"
              textStyle="xs"
              color="fg.muted"
            >
              <Text
                as="span"
                fontWeight="bold"
                fontVariantNumeric="tabular-nums"
              >
                {runningJob.current}
              </Text>
              <Text as="span">{runningJob.eta}</Text>
            </HStack>
            <Box h="1.5" bg="bg.emphasized" rounded="full" overflow="hidden">
              <Box
                h="full"
                bg="colorPalette.solid"
                rounded="full"
                transition="width 0.3s"
                style={{ width: `${runningJob.progress}%` }}
              />
            </Box>
          </Stack>
        ) : (
          <Text
            textStyle="2xl"
            fontWeight="bold"
            mt="1"
            fontVariantNumeric="tabular-nums"
          >
            {formatCompact(totalIterations)}
          </Text>
        )}
      </Card.Body>
    </Card.Root>
  );
}
