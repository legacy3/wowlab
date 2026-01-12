"use client";

import { Cpu, X } from "lucide-react";
import NextLink from "next/link";
import { useMemo } from "react";
import { HStack, Stack, styled } from "styled-system/jsx";

import { JOB_STATUS_ICONS } from "@/components/computing";
import {
  AbsoluteCenter,
  Badge,
  Button,
  Drawer,
  Empty,
  IconButton,
  InlineLoader,
  Link,
  Text,
} from "@/components/ui";
import {
  PHASE_LABELS,
  selectActiveJobs,
  selectCompletedJobs,
  type SimulationJob,
  useComputingDrawer,
  useJobs,
} from "@/lib/state";

export function ComputingDrawer() {
  const { open, setOpen } = useComputingDrawer();
  const jobs = useJobs((s) => s.jobs);

  const activeJobs = useMemo(() => selectActiveJobs(jobs), [jobs]);
  const completedJobs = useMemo(() => selectCompletedJobs(jobs), [jobs]);

  const handleClose = () => setOpen(false);

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
                Computing
              </HStack>
            </Drawer.Title>
            <Drawer.Description>
              <HStack justifyContent="space-between">
                <span>
                  {activeJobs.length > 0
                    ? `${activeJobs.length} simulation${activeJobs.length > 1 ? "s" : ""} running`
                    : "No active simulations"}
                </span>
                <Link asChild textStyle="xs">
                  <NextLink href="/computing" onClick={handleClose}>
                    Dashboard
                  </NextLink>
                </Link>
              </HStack>
            </Drawer.Description>
            <Drawer.CloseTrigger asChild pos="absolute" top="3" right="3">
              <IconButton variant="plain" size="sm" aria-label="Close">
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
                  Active
                </Text>
                <Stack gap="3">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} onClose={handleClose} />
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
                  Recent
                </Text>
                <Stack gap="3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <JobCard key={job.id} job={job} onClose={handleClose} />
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
                    <Empty.Title>No simulations yet</Empty.Title>
                    <Empty.Description>
                      Run a simulation to see progress here
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

function JobCard({
  job,
  onClose,
}: {
  job: SimulationJob;
  onClose: () => void;
}) {
  const cancelJob = useJobs((s) => s.cancelJob);
  const StatusIcon = JOB_STATUS_ICONS[job.status];

  return (
    <styled.div rounded="xl" borderWidth="1" bg="bg.subtle" p="5" spaceY="4">
      <HStack justifyContent="space-between" gap="3">
        <HStack gap="3" minW="0">
          {job.status === "running" ? (
            <InlineLoader variant="processing" />
          ) : StatusIcon ? (
            <StatusIcon style={{ height: 20, width: 20 }} />
          ) : null}
          <Text fontWeight="medium">{job.name}</Text>
        </HStack>
        {(job.status === "running" || job.status === "queued") && (
          <IconButton
            variant="plain"
            size="sm"
            aria-label="Cancel"
            onClick={() => cancelJob(job.id)}
          >
            <X style={{ height: 16, width: 16 }} />
          </IconButton>
        )}
      </HStack>

      <Stack gap="2">
        <HStack justifyContent="space-between">
          <Badge variant="outline">{PHASE_LABELS[job.phase]}</Badge>
          {job.status !== "completed" && job.status !== "failed" && (
            <Text textStyle="sm" color="fg.muted">
              {job.eta}
            </Text>
          )}
        </HStack>
        {job.status !== "completed" && job.phaseDetail && (
          <Text textStyle="sm" color="fg.muted">
            {job.phaseDetail}
          </Text>
        )}
      </Stack>

      {job.status !== "completed" && job.status !== "failed" && (
        <Stack gap="2">
          <styled.div h="2" bg="bg.emphasized" rounded="full" overflow="hidden">
            <styled.div
              h="full"
              bg="colorPalette.solid"
              rounded="full"
              transition="width 0.3s"
              style={{ width: `${job.progress}%` }}
            />
          </styled.div>
          <HStack
            justifyContent="space-between"
            textStyle="sm"
            color="fg.muted"
          >
            <span>{job.progress}%</span>
            <span>{job.current}</span>
          </HStack>
        </Stack>
      )}

      {job.status === "failed" && job.error && (
        <Text textStyle="sm" color="red.11">
          {job.error}
        </Text>
      )}

      {job.status === "completed" && job.result && (
        <Button variant="outline" size="sm" w="full" asChild onClick={onClose}>
          <NextLink href={`/simulate/results/${job.id}`}>View Results</NextLink>
        </Button>
      )}
    </styled.div>
  );
}
