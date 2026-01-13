"use client";

import { Cpu, X } from "lucide-react";
import { useExtracted } from "next-intl";
import { useMemo } from "react";
import { HStack, Stack, styled } from "styled-system/jsx";

import { JOB_STATUS_ICONS } from "@/components/computing";
import {
  AbsoluteCenter,
  Badge,
  Button,
  Drawer,
  Empty,
  ErrorBox,
  IconButton,
  InlineLoader,
  Link,
  Text,
} from "@/components/ui";
import { href, routes } from "@/lib/routing";
import {
  PHASE_LABELS,
  selectActiveJobs,
  selectCompletedJobs,
  type SimulationJob,
  useComputingDrawer,
  useJobs,
} from "@/lib/state";

export function ComputingDrawer() {
  const t = useExtracted();
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
                {t("Computing")}
              </HStack>
            </Drawer.Title>
            <Drawer.Description>
              <HStack justifyContent="space-between">
                <span>
                  {activeJobs.length > 0
                    ? t("{count} simulation running", {
                        count: String(activeJobs.length),
                      })
                    : t("No active simulations")}
                </span>
                <Link
                  href={href(routes.computing)}
                  textStyle="xs"
                  onClick={handleClose}
                >
                  {t("Dashboard")}
                </Link>
              </HStack>
            </Drawer.Description>
            <Drawer.CloseTrigger asChild pos="absolute" top="3" right="3">
              <IconButton variant="plain" size="sm" aria-label={t("Close")}>
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
                  {t("Active")}
                </Text>
                <Stack gap="3">
                  {activeJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClose={handleClose}
                      cancelLabel={t("Cancel")}
                      viewResultsLabel={t("View Results")}
                    />
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
                  {t("Recent")}
                </Text>
                <Stack gap="3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClose={handleClose}
                      cancelLabel={t("Cancel")}
                      viewResultsLabel={t("View Results")}
                    />
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
                    <Empty.Title>{t("No simulations yet")}</Empty.Title>
                    <Empty.Description>
                      {t("Run a simulation to see progress here")}
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
  cancelLabel,
  job,
  onClose,
  viewResultsLabel,
}: {
  cancelLabel: string;
  job: SimulationJob;
  onClose: () => void;
  viewResultsLabel: string;
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
            aria-label={cancelLabel}
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

      {job.status === "failed" && job.error && <ErrorBox>{job.error}</ErrorBox>}

      {job.status === "completed" && job.result && (
        <Button variant="outline" size="sm" w="full" asChild onClick={onClose}>
          <Link href={href(routes.simulate.results, { id: job.id })}>
            {viewResultsLabel}
          </Link>
        </Button>
      )}
    </styled.div>
  );
}
