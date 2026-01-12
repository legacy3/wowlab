"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { css } from "styled-system/css";
import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import type { JobStatus, SimulationJob } from "@/lib/state";

import {
  Badge,
  Button,
  Card,
  Dialog,
  ErrorBox,
  IconButton,
  InlineLoader,
  Input,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";
import { useJobs } from "@/lib/state";
import { formatCompact, formatDurationMs, formatInt } from "@/lib/utils";

import {
  JOB_STATUS_COLORS,
  JOB_STATUS_ICONS,
  JobStatusBadge,
} from "../job-status";

const statuses: (JobStatus | "all")[] = [
  "all",
  "running",
  "queued",
  "completed",
  "failed",
];

export function JobHistoryCard() {
  const jobs = useJobs((s) => s.jobs);
  const cancelJob = useJobs((s) => s.cancelJob);

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");
  const [selectedJob, setSelectedJob] = useState<SimulationJob | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }
      if (filter) {
        const search = filter.toLowerCase();
        return job.name.toLowerCase().includes(search);
      }
      return true;
    });
  }, [jobs, filter, statusFilter]);

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
              Simulation History
              <Text
                as="span"
                ml="2"
                textStyle="sm"
                fontWeight="normal"
                color="fg.muted"
                fontVariantNumeric="tabular-nums"
              >
                ({formatInt(filteredJobs.length)} jobs)
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
                    className={css({
                      _hover: { bg: "bg.muted" },
                      bg: isActive
                        ? (colors?.bg ?? "colorPalette.3")
                        : undefined,
                      borderColor: isActive
                        ? (colors?.border ?? "colorPalette.6")
                        : undefined,
                      color: isActive
                        ? (colors?.text ?? "colorPalette.11")
                        : undefined,
                    })}
                  >
                    {status === "all"
                      ? "All"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                );
              })}
            </HStack>
          </Stack>
        </Card.Header>
        <Card.Body spaceY="4" pt="0">
          <Input
            placeholder="Filter jobs ..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            maxW="sm"
          />
          <Box maxH="400px" overflow="auto" rounded="lg" borderWidth="1">
            <Table.Root variant="surface">
              <Table.Head
                position="sticky"
                top="0"
                zIndex="10"
                bg="bg.muted/95"
                backdropFilter="blur(4px)"
              >
                <Table.Row>
                  <Table.Header w="100px" fontWeight="medium">
                    Status
                  </Table.Header>
                  <Table.Header fontWeight="medium">Name</Table.Header>
                  <Table.Header w="120px" fontWeight="medium">
                    DPS
                  </Table.Header>
                  <Table.Header w="100px" fontWeight="medium">
                    Casts
                  </Table.Header>
                  <Table.Header w="80px" fontWeight="medium">
                    Actions
                  </Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filteredJobs.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={5}
                      h="32"
                      textAlign="center"
                      color="fg.muted"
                    >
                      {jobs.length === 0
                        ? "No simulations yet"
                        : "No jobs match the current filter"}
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  filteredJobs.map((job) => (
                    <Table.Row
                      key={job.id}
                      cursor="pointer"
                      _hover={{ bg: "bg.subtle" }}
                      onClick={() => setSelectedJob(job)}
                    >
                      <Table.Cell>
                        <JobStatusBadge status={job.status} />
                      </Table.Cell>
                      <Table.Cell fontWeight="medium">{job.name}</Table.Cell>
                      <Table.Cell
                        fontFamily="mono"
                        textStyle="sm"
                        fontVariantNumeric="tabular-nums"
                      >
                        {job.result?.dps
                          ? formatCompact(job.result.dps)
                          : "\u2014"}
                      </Table.Cell>
                      <Table.Cell
                        fontFamily="mono"
                        textStyle="sm"
                        fontVariantNumeric="tabular-nums"
                      >
                        {job.result?.casts ?? "\u2014"}
                      </Table.Cell>
                      <Table.Cell>
                        <Tooltip content="Cancel">
                          <IconButton
                            variant="plain"
                            size="xs"
                            aria-label="Cancel simulation"
                            disabled={
                              job.status !== "running" &&
                              job.status !== "queued"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelJob(job.id);
                            }}
                          >
                            <X style={{ height: 14, width: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>
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
                  {selectedJob &&
                    (selectedJob.status === "running" ? (
                      <InlineLoader variant="processing" />
                    ) : (
                      (() => {
                        const Icon = JOB_STATUS_ICONS[selectedJob.status];
                        return Icon ? (
                          <Icon style={{ height: 16, width: 16 }} />
                        ) : null;
                      })()
                    ))}
                  {selectedJob?.name}
                </HStack>
              </Dialog.Title>
              <Dialog.Description>Job ID: {selectedJob?.id}</Dialog.Description>
            </Dialog.Header>

            <Dialog.Body>
              {selectedJob && (
                <Stack gap="4">
                  <HStack gap="2">
                    <JobStatusBadge status={selectedJob.status} />
                    <Text textStyle="sm" color="fg.muted">
                      {selectedJob.current}
                    </Text>
                  </HStack>

                  {selectedJob.result && (
                    <Grid columns={2} gap="4" p="4" rounded="lg" bg="bg.muted">
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          DPS
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {formatInt(selectedJob.result.dps)}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          Casts
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {formatInt(selectedJob.result.casts)}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          Total Damage
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {formatCompact(selectedJob.result.totalDamage)}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          Duration
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {formatDurationMs(selectedJob.result.durationMs)}
                        </Text>
                      </Box>
                    </Grid>
                  )}

                  {selectedJob.error && (
                    <Stack gap="2">
                      <Text textStyle="sm" fontWeight="medium" color="red.11">
                        Error
                      </Text>
                      <ErrorBox>{selectedJob.error}</ErrorBox>
                    </Stack>
                  )}

                  <Stack gap="1" textStyle="xs" color="fg.muted">
                    <Text>Rotation ID: {selectedJob.rotationId}</Text>
                    {selectedJob.resultId && (
                      <Text>Result ID: {selectedJob.resultId}</Text>
                    )}
                  </Stack>
                </Stack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">Close</Button>
              </Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
