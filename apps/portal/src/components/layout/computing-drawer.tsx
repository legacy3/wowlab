"use client";

import { Cpu, X } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo } from "react";
import { HStack, Stack, styled } from "styled-system/jsx";

import { JOB_STATUS_ICONS } from "@/components/computing";
import {
  AbsoluteCenter,
  Badge,
  Drawer,
  Empty,
  IconButton,
  InlineLoader,
  Link,
  Progress,
  Text,
} from "@/components/ui";
import { href, routes } from "@/lib/routing";
import {
  type DistributedJobStatus,
  type Job,
  useComputingDrawer,
  useUserJobs,
} from "@/lib/state";

const STATUS_LABELS: Record<DistributedJobStatus, string> = {
  completed: "Completed",
  failed: "Failed",
  pending: "Pending",
  running: "Running",
};

export function ComputingDrawer() {
  const { computingDrawer: content } = useIntlayer("layout");
  const { open, setOpen } = useComputingDrawer();
  const { data: jobs = [] } = useUserJobs();

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "pending" || j.status === "running"),
    [jobs],
  );
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs],
  );

  const handleClose = () => setOpen(false);

  const getSimulationCountText = (count: number) => {
    if (count === 1) {
      return `1 ${content.simulationRunning}`;
    }
    return `${count} ${content.simulationsRunning}`;
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      placement="end"
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content w={{ base: "full", md: "480px", sm: "420px" }}>
          <Drawer.Header>
            <Drawer.Title>
              <HStack gap="2.5">
                <Cpu style={{ height: 20, width: 20 }} />
                {content.computing}
              </HStack>
            </Drawer.Title>
            <Drawer.Description>
              <HStack justifyContent="space-between">
                <span>
                  {activeJobs.length > 0
                    ? getSimulationCountText(activeJobs.length)
                    : content.noActiveSimulations}
                </span>
                <Link
                  href={href(routes.computing)}
                  textStyle="xs"
                  onClick={handleClose}
                >
                  {content.dashboard}
                </Link>
              </HStack>
            </Drawer.Description>
            <Drawer.CloseTrigger asChild pos="absolute" top="3" right="3">
              <IconButton
                variant="plain"
                size="sm"
                aria-label={content.close.value}
              >
                <X />
              </IconButton>
            </Drawer.CloseTrigger>
          </Drawer.Header>

          <Drawer.Body display="flex" flexDir="column" gap="8">
            {activeJobs.length > 0 && (
              <Stack gap="4">
                <Text
                  textStyle="sm"
                  fontWeight="medium"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {content.active}
                </Text>
                <Stack gap="3">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </Stack>
              </Stack>
            )}

            {completedJobs.length > 0 && (
              <Stack gap="4">
                <Text
                  textStyle="sm"
                  fontWeight="medium"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {content.recent}
                </Text>
                <Stack gap="3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </Stack>
              </Stack>
            )}

            {jobs.length === 0 && (
              <AbsoluteCenter axis="both">
                <Empty.Root variant="plain">
                  <Empty.Icon>
                    <Cpu />
                  </Empty.Icon>
                  <Empty.Content>
                    <Empty.Title>{content.noSimulationsYet}</Empty.Title>
                    <Empty.Description>
                      {content.runSimulationToSee}
                    </Empty.Description>
                  </Empty.Content>
                </Empty.Root>
              </AbsoluteCenter>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}

function JobCard({ job }: { job: Job }) {
  const StatusIcon = JOB_STATUS_ICONS[job.status];
  const progress =
    job.chunksTotal > 0
      ? Math.round((job.chunksCompleted / job.chunksTotal) * 100)
      : 0;

  return (
    <styled.div rounded="xl" borderWidth="1" bg="bg.subtle" p="5" spaceY="4">
      <HStack justifyContent="space-between" gap="3">
        <HStack gap="3" minW="0">
          {job.status === "running" ? (
            <InlineLoader variant="processing" />
          ) : StatusIcon ? (
            <StatusIcon style={{ height: 20, width: 20 }} />
          ) : null}
          <Text fontWeight="medium" fontFamily="mono" textStyle="sm">
            {job.id.slice(0, 8)}
          </Text>
        </HStack>
        <Badge variant="outline">{STATUS_LABELS[job.status]}</Badge>
      </HStack>

      {job.status !== "completed" && (
        <Stack gap="2">
          <Progress.Root value={progress}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <HStack
            justifyContent="space-between"
            textStyle="sm"
            color="fg.muted"
          >
            <span>{progress}%</span>
            <span>
              {job.chunksCompleted.toLocaleString()} /{" "}
              {job.chunksTotal.toLocaleString()}
            </span>
          </HStack>
        </Stack>
      )}

      {job.status === "completed" && job.result && (
        <HStack gap="4" textStyle="sm">
          <Stack gap="0">
            <Text color="fg.muted" textStyle="xs">
              Mean DPS
            </Text>
            <Text fontWeight="bold" fontVariantNumeric="tabular-nums">
              {job.result.meanDps.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </Stack>
          <Stack gap="0">
            <Text color="fg.muted" textStyle="xs">
              Range
            </Text>
            <Text fontVariantNumeric="tabular-nums">
              {job.result.minDps.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              {" \u2013 "}
              {job.result.maxDps.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </Stack>
        </HStack>
      )}
    </styled.div>
  );
}
