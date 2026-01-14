"use client";

import { X } from "lucide-react";
import { useExtracted, useFormatter } from "next-intl";
import { useMemo, useState } from "react";
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
  const t = useExtracted();
  const format = useFormatter();
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
    all: t("All"),
    cancelled: t("Cancelled"),
    completed: t("Completed"),
    failed: t("Failed"),
    paused: t("Paused"),
    queued: t("Queued"),
    running: t("Running"),
  };

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
              {t("Simulation History")}
              <Text
                as="span"
                ml="2"
                textStyle="sm"
                fontWeight="normal"
                color="fg.muted"
                fontVariantNumeric="tabular-nums"
              >
                (
                {t("{count, plural, =1 {# job} other {# jobs}}", {
                  count: filteredJobs.length,
                })}
                )
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
            placeholder={t("Filter jobs...")}
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
                    {t("Status")}
                  </Table.Header>
                  <Table.Header fontWeight="medium">{t("Name")}</Table.Header>
                  <Table.Header w="120px" fontWeight="medium">
                    {t("DPS")}
                  </Table.Header>
                  <Table.Header w="100px" fontWeight="medium">
                    {t("Casts")}
                  </Table.Header>
                  <Table.Header w="80px" fontWeight="medium">
                    {t("Actions")}
                  </Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filteredJobs.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5} h="32">
                      <Empty.Root variant="plain" size="sm">
                        <Empty.Content>
                          <Empty.Title>
                            {jobs.length === 0
                              ? t("No simulations yet")
                              : t("No jobs match the current filter")}
                          </Empty.Title>
                        </Empty.Content>
                      </Empty.Root>
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
                          ? format.number(job.result.dps, {
                              notation: "compact",
                            })
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
                        <Tooltip content={t("Cancel")}>
                          <IconButton
                            variant="plain"
                            size="xs"
                            aria-label={t("Cancel simulation")}
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
              <Dialog.Description>
                {t("Job ID: {id}", { id: selectedJob?.id ?? "" })}
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
                          {t("DPS")}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {format.number(selectedJob.result.dps)}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {t("Casts")}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {format.number(selectedJob.result.casts)}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {t("Total Damage")}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {format.number(selectedJob.result.totalDamage, {
                            notation: "compact",
                          })}
                        </Text>
                      </Box>
                      <Box>
                        <Text textStyle="xs" color="fg.muted">
                          {t("Duration")}
                        </Text>
                        <Text
                          textStyle="lg"
                          fontWeight="bold"
                          fontVariantNumeric="tabular-nums"
                        >
                          {format.number(selectedJob.result.durationMs / 1000, {
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
                        {t("Error")}
                      </Text>
                      <ErrorBox>{selectedJob.error}</ErrorBox>
                    </Stack>
                  )}

                  <Stack gap="1" textStyle="xs" color="fg.muted">
                    <Text>
                      {t("Rotation ID: {id}", { id: selectedJob.rotationId })}
                    </Text>
                    {selectedJob.resultId && (
                      <Text>
                        {t("Result ID: {id}", { id: selectedJob.resultId })}
                      </Text>
                    )}
                  </Stack>
                </Stack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">{t("Close")}</Button>
              </Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
