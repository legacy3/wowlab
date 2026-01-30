"use client";

import { useIntlayer } from "next-intlayer";
import { HStack, Stack } from "styled-system/jsx";

import { Button, Card, Loader, Progress, Text } from "@/components/ui";
import { useJob } from "@/lib/state";

export interface ResultsStepProps {
  jobId: string | null;
  onBack: () => void;
}

export function ResultsStep({ jobId, onBack }: ResultsStepProps) {
  const { resultsStep: content } = useIntlayer("simulate");

  const { data: job, error, isLoading } = useJob(jobId);

  if (!jobId) {
    return (
      <Stack gap="6">
        <Card.Root>
          <Card.Body>
            <Stack gap="4" align="center" py="8">
              <Text color="fg.muted">{content.workInProgress}</Text>
            </Stack>
          </Card.Body>
        </Card.Root>
        <Button variant="outline" onClick={onBack} alignSelf="start">
          {content.back}
        </Button>
      </Stack>
    );
  }

  if (isLoading && !job) {
    return (
      <Stack gap="6">
        <Card.Root>
          <Card.Body>
            <Stack gap="4" align="center" py="8">
              <Loader size="lg" />
              <Text color="fg.muted">{content.loadingJob}</Text>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="6">
        <Card.Root>
          <Card.Body>
            <Stack gap="4" align="center" py="8">
              <Text color="fg.error">
                {content.error({ message: error.message })}
              </Text>
            </Stack>
          </Card.Body>
        </Card.Root>
        <Button variant="outline" onClick={onBack} alignSelf="start">
          {content.back}
        </Button>
      </Stack>
    );
  }

  if (!job) {
    return (
      <Stack gap="6">
        <Card.Root>
          <Card.Body>
            <Stack gap="4" align="center" py="8">
              <Text color="fg.muted">{content.jobNotFound}</Text>
            </Stack>
          </Card.Body>
        </Card.Root>
        <Button variant="outline" onClick={onBack} alignSelf="start">
          {content.back}
        </Button>
      </Stack>
    );
  }

  const progress =
    job.chunksTotal > 0 ? (job.chunksCompleted / job.chunksTotal) * 100 : 0;

  if (job.status !== "completed") {
    return (
      <Stack gap="6">
        <Card.Root>
          <Card.Header>
            <Card.Title>{content.simulationResults}</Card.Title>
            <Card.Description>
              {job.status === "pending"
                ? content.waitingForNodes
                : content.running}
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <Stack gap="6">
              <Stack gap="2">
                <HStack justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    {content.progress}
                  </Text>
                  <Text textStyle="sm" fontWeight="medium">
                    {content.progressIterations({
                      completed: formatNumber(job.chunksCompleted),
                      total: formatNumber(job.chunksTotal),
                    })}
                  </Text>
                </HStack>
                <Progress.Root value={progress}>
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Stack>

              <HStack gap="4" justify="center" py="4">
                <Loader size="md" variant="processing" />
                <Text color="fg.muted">
                  {job.status === "pending"
                    ? content.queued
                    : content.simulationInProgress}
                </Text>
              </HStack>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Button variant="outline" onClick={onBack} alignSelf="start">
          {content.back}
        </Button>
      </Stack>
    );
  }

  const result = job.result;

  return (
    <Stack gap="6">
      <Card.Root>
        <Card.Header>
          <Card.Title>{content.simulationResults}</Card.Title>
          <Card.Description>
            {content.completed({
              iterations: formatNumber(job.chunksTotal),
            })}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          {result ? (
            <Stack gap="6">
              {/* Main DPS Result */}
              <Stack gap="1" align="center" py="4">
                <Text textStyle="4xl" fontWeight="bold" color="fg.default">
                  {formatNumber(result.meanDps)}
                </Text>
                <Text textStyle="sm" color="fg.muted">
                  {content.averageDps}
                </Text>
              </Stack>

              <HStack gap="8" justify="center">
                <Stack gap="1" align="center">
                  <Text textStyle="xl" fontWeight="medium">
                    {formatNumber(result.minDps)}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {content.minDps}
                  </Text>
                </Stack>
                <Stack gap="1" align="center">
                  <Text textStyle="xl" fontWeight="medium">
                    {formatNumber(result.maxDps)}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {content.maxDps}
                  </Text>
                </Stack>
              </HStack>

              <HStack gap="6" justify="center" pt="4" borderTopWidth="1">
                <Stack gap="0" align="center">
                  <Text textStyle="sm" fontWeight="medium">
                    {formatNumber(result.totalIterations)}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {content.iterations}
                  </Text>
                </Stack>
                <Stack gap="0" align="center">
                  <Text textStyle="sm" fontWeight="medium">
                    {result.chunksCompleted}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {content.chunks}
                  </Text>
                </Stack>
              </HStack>
            </Stack>
          ) : (
            <Stack gap="4" align="center" py="8">
              <Text color="fg.muted">{content.noResults}</Text>
            </Stack>
          )}
        </Card.Body>
      </Card.Root>

      <HStack gap="3">
        <Button variant="outline" onClick={onBack}>
          {content.back}
        </Button>
        <Button onClick={onBack}>{content.runAnother}</Button>
      </HStack>
    </Stack>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
