"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { X } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo, useRef, useState } from "react";
import { css } from "styled-system/css";
import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import type { JobStatus, SimulationJob } from "@/lib/state";

import {
  Badge,
  Button,
  Card,
  Dialog,
  Empty,
  ErrorBox,
  IconButton,
  InlineLoader,
  Input,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";
import { useJobs } from "@/lib/state";

import {
  JOB_STATUS_COLORS,
  JOB_STATUS_ICONS,
  JobStatusBadge,
} from "../job-status";

const statuses: (JobStatus | "all")[] = [
  "all",
  "running",
  "queued",
  "paused",
  "completed",
  "failed",
  "cancelled",
];

export function JobHistoryCard() {
  const content = useIntlayer("computing").jobHistoryCard;
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

  const statusLabels: Record<JobStatus | "all", string> = {
    all: content.all,
    cancelled: content.cancelled,
    completed: content.completed,
    failed: content.failed,
    paused: content.paused,
    queued: content.queued,
    running: content.running,
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredJobs.length,
    estimateSize: () => 48,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

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
                    {statusLabels[status]}
                  </Badge>
                );
              })}
            </HStack>
          </Stack>
        </Card.Header>
        <Card.Body spaceY="4" pt="0">
          <Input
            placeholder={content.filterJobs}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            maxW="sm"
          />
          <Box rounded="lg" borderWidth="1" overflow="hidden">
            <Table.Root variant="surface">
              <Table.Head bg="bg.muted/95">
                <Table.Row>
                  <Table.Header w="100px" fontWeight="medium">
                    {content.status}
                  </Table.Header>
                  <Table.Header fontWeight="medium">
                    {content.name}
                  </Table.Header>
                  <Table.Header w="120px" fontWeight="medium">
                    {content.dps}
                  </Table.Header>
                  <Table.Header w="100px" fontWeight="medium">
                    {content.casts}
                  </Table.Header>
                  <Table.Header w="80px" fontWeight="medium">
                    {content.actions}
                  </Table.Header>
                </Table.Row>
              </Table.Head>
            </Table.Root>
            <Box ref={parentRef} maxH="352px" overflow="auto">
              {filteredJobs.length === 0 ? (
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
              ) : (
                <Box h={`${virtualizer.getTotalSize()}px`} position="relative">
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const job = filteredJobs[virtualRow.index];

                    return (
                      <Table.Root
                        key={job.id}
                        variant="surface"
                        position="absolute"
                        top="0"
                        left="0"
                        w="full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <Table.Body>
                          <Table.Row
                            cursor="pointer"
                            _hover={{ bg: "bg.subtle" }}
                            onClick={() => setSelectedJob(job)}
                          >
                            <Table.Cell w="100px">
                              <JobStatusBadge status={job.status} />
                            </Table.Cell>
                            <Table.Cell fontWeight="medium">
                              {job.name}
                            </Table.Cell>
                            <Table.Cell
                              w="120px"
                              fontFamily="mono"
                              textStyle="sm"
                              fontVariantNumeric="tabular-nums"
                            >
                              {job.result?.dps
                                ? job.result.dps.toLocaleString(undefined, {
                                    notation: "compact",
                                  })
                                : "\u2014"}
                            </Table.Cell>
                            <Table.Cell
                              w="100px"
                              fontFamily="mono"
                              textStyle="sm"
                              fontVariantNumeric="tabular-nums"
                            >
                              {job.result?.casts ?? "\u2014"}
                            </Table.Cell>
                            <Table.Cell w="80px">
                              <Tooltip content={content.cancel}>
                                <IconButton
                                  variant="plain"
                                  size="xs"
                                  aria-label={content.cancelSimulation}
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
                        </Table.Body>
                      </Table.Root>
                    );
                  })}
                </Box>
              )}
            </Box>
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
              <Dialog.Description>
                {`Job ID: ${selectedJob?.id ?? ""}`}
              </Dialog.Description>
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
                          {content.dps}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.dps.toLocaleString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.casts}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.casts.toLocaleString()}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.totalDamage}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {selectedJob.result.totalDamage.toLocaleString(
                            undefined,
                            {
                              notation: "compact",
                            },
                          )}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {content.duration}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {(
                            selectedJob.result.durationMs / 1000
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                            style: "unit",
                            unit: "second",
                          })}
                        </Text>
                      </Box>
                    </Grid>
                  )}

                  {selectedJob.error && (
                    <Stack gap="2">
                      <Text textStyle="sm" fontWeight="medium" color="red.11">
                        {content.error}
                      </Text>
                      <ErrorBox>{selectedJob.error}</ErrorBox>
                    </Stack>
                  )}

                  <Stack gap="1" textStyle="xs" color="fg.muted">
                    <Text>{`Rotation ID: ${selectedJob.rotationId}`}</Text>
                    {selectedJob.resultId && (
                      <Text>{`Result ID: ${selectedJob.resultId}`}</Text>
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
