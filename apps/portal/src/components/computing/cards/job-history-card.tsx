"use client";

import { useIntlayer } from "next-intlayer";
import { useMemo, useState } from "react";
import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import type { DistributedJobStatus, Job } from "@/lib/state";

import {
  Badge,
  Button,
  Card,
  Dialog,
  Empty,
  Loader,
  Progress,
  Table,
  Text,
} from "@/components/ui";
import { useUserJobs } from "@/lib/state";

import { JOB_STATUS_COLORS, JobStatusBadge } from "../job-status";

const statuses: (DistributedJobStatus | "all")[] = [
  "all",
  "pending",
  "running",
  "completed",
];

export function JobHistoryCard() {
  const content = useIntlayer("computing").jobHistoryCard;
  const { data: jobs = [], isLoading } = useUserJobs();

  const [statusFilter, setStatusFilter] = useState<
    DistributedJobStatus | "all"
  >("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [jobs, statusFilter]);

  const statusLabels: Record<DistributedJobStatus | "all", string> = {
    all: content.all,
    completed: content.completed,
    failed: content.failed ?? "Failed",
    pending: content.pending,
    running: content.running,
  };

  const jobCountText =
    filteredJobs.length === 1 ? "1 job" : `${filteredJobs.length} jobs`;

  return (
    <>
      <Card.Root>
        <Card.Header pb="4">
          <Stack
            gap="4"
            flexDir={{ base: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
          >
            <Card.Title textStyle="base" fontWeight="medium">
              {content.simulationHistory}
              <Text
                as="span"
                ml="2"
                textStyle="sm"
                fontWeight="normal"
                color="fg.muted"
                fontVariantNumeric="tabular-nums"
              >
                ({jobCountText})
              </Text>
            </Card.Title>
            <HStack gap="1.5" flexWrap="wrap">
              {statuses.map((status) => {
                const isActive = statusFilter === status;
                const colors =
                  status === "all" ? null : JOB_STATUS_COLORS[status];
                return (
                  <Badge
                    key={status}
                    variant="outline"
                    cursor="pointer"
                    onClick={() => setStatusFilter(status)}
                    bg={isActive ? (colors?.bg ?? "colorPalette.3") : undefined}
                    borderColor={
                      isActive
                        ? (colors?.border ?? "colorPalette.6")
                        : undefined
                    }
                    color={
                      isActive ? (colors?.text ?? "colorPalette.11") : undefined
                    }
                    _hover={{ bg: "bg.muted" }}
                  >
                    {statusLabels[status]}
                  </Badge>
                );
              })}
            </HStack>
          </Stack>
        </Card.Header>
        <Card.Body spaceY="4" pt="0">
          {isLoading && jobs.length === 0 ? (
            <Stack align="center" py="8">
              <Loader size="md" />
            </Stack>
          ) : (
            <Box rounded="lg" borderWidth="1" overflow="hidden">
              <Table.Root variant="surface">
                <Table.Head bg="bg.muted/95">
                  <Table.Row>
                    <Table.Header w="100px" fontWeight="medium">
                      {content.status}
                    </Table.Header>
                    <Table.Header fontWeight="medium">
                      {content.jobId}
                    </Table.Header>
                    <Table.Header w="160px" fontWeight="medium">
                      {content.progress}
                    </Table.Header>
                    <Table.Header w="120px" fontWeight="medium">
                      {content.dps}
                    </Table.Header>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {filteredJobs.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4}>
                        <Box h="32">
                          <Empty.Root variant="plain" size="sm">
                            <Empty.Content>
                              <Empty.Title>
                                {jobs.length === 0
                                  ? content.noSimulationsYet
                                  : content.noJobsMatchFilter}
                              </Empty.Title>
                            </Empty.Content>
                          </Empty.Root>
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredJobs.map((job) => {
                      const progress =
                        job.chunksTotal > 0
                          ? Math.round(
                              (job.chunksCompleted / job.chunksTotal) * 100,
                            )
                          : 0;

                      return (
                        <Table.Row
                          key={job.id}
                          cursor="pointer"
                          _hover={{ bg: "bg.subtle" }}
                          onClick={() => setSelectedJob(job)}
                        >
                          <Table.Cell w="100px">
                            <JobStatusBadge status={job.status} />
                          </Table.Cell>
                          <Table.Cell fontFamily="mono" textStyle="sm">
                            {job.id.slice(0, 8)}
                          </Table.Cell>
                          <Table.Cell w="160px">
                            <HStack gap="2">
                              <Progress.Root
                                value={progress}
                                size="sm"
                                flex="1"
                              >
                                <Progress.Track>
                                  <Progress.Range />
                                </Progress.Track>
                              </Progress.Root>
                              <Text
                                textStyle="xs"
                                color="fg.muted"
                                fontVariantNumeric="tabular-nums"
                                minW="8"
                                textAlign="right"
                              >
                                {progress}%
                              </Text>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell
                            w="120px"
                            fontFamily="mono"
                            textStyle="sm"
                            fontVariantNumeric="tabular-nums"
                          >
                            {job.result?.meanDps
                              ? job.result.meanDps.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })
                              : "\u2014"}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Card.Body>
      </Card.Root>

      <Dialog.Root
        open={!!selectedJob}
        onOpenChange={(details) => !details.open && setSelectedJob(null)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <Dialog.Title>
                <HStack gap="2">
                  {selectedJob && (
                    <JobStatusBadge status={selectedJob.status} />
                  )}
                  {content.jobDetails}
                </HStack>
              </Dialog.Title>
              <Dialog.Description>{selectedJob?.id ?? ""}</Dialog.Description>
            </Dialog.Header>

            <Dialog.Body>
              {selectedJob && (
                <Stack gap="4">
                  <Stack gap="2">
                    <HStack justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        {content.progress}
                      </Text>
                      <Text textStyle="sm" fontWeight="medium">
                        {selectedJob.chunksCompleted.toLocaleString()} /{" "}
                        {selectedJob.chunksTotal.toLocaleString()}
                      </Text>
                    </HStack>
                    <Progress.Root
                      value={
                        selectedJob.chunksTotal > 0
                          ? (selectedJob.chunksCompleted /
                              selectedJob.chunksTotal) *
                            100
                          : 0
                      }
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Stack>

                  {selectedJob.result && (
                    <Grid columns={2} gap="4" p="4" rounded="lg" bg="bg.muted">
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.meanDps}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.meanDps.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 0,
                            },
                          )}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.dpsRange}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.minDps.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                          {" \u2013 "}
                          {selectedJob.result.maxDps.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.iterations}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.totalIterations.toLocaleString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.chunks}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.chunksCompleted}
                        </Text>
                      </Box>
                    </Grid>
                  )}

                  <Stack gap="1" textStyle="xs" color="fg.muted">
                    <Text>
                      {content.created}:{" "}
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </Text>
                    {selectedJob.completedAt && (
                      <Text>
                        {content.completed}:{" "}
                        {new Date(selectedJob.completedAt).toLocaleString()}
                      </Text>
                    )}
                  </Stack>
                </Stack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">{content.close}</Button>
              </Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
