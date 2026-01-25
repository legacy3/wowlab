"use client";

import { useGetIdentity, useInvalidate, useList } from "@refinedev/core";
import { useCallback, useState } from "react";

import type { SimulationResult } from "@/lib/engine";
import type { Json } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/client";

import { useResource } from "../hooks/use-resource";
import { jobs } from "../resources";

export type DistributedJobStatus =
  | "completed"
  | "failed"
  | "pending"
  | "running";

export interface Job {
  chunksCompleted: number;
  chunksFailed: number;
  chunksTotal: number;
  completedAt: Date | null;
  config: SimConfig;
  createdAt: Date;
  errorMessage: string | null;
  id: string;
  result: SimulationResult | null;
  status: DistributedJobStatus;
  updatedAt: Date;
}

export interface SimConfig {
  duration: number;
  iterations: number;
  rotationId?: string;
  specId: number;
  targetError: number;
}

export interface SubmitJobInput {
  config: SimConfig;
  iterations: number;
}

export interface SubmitJobResult {
  iterations: number;
  jobId: string;
}

type JobRow = {
  chunks_completed: number;
  chunks_failed: number;
  chunks_total: number;
  completed_at: string | null;
  config: Json;
  created_at: string;
  error_message: string | null;
  id: string;
  result: Json;
  status: string;
  updated_at: string;
  user_id: string;
};

interface User {
  id: string;
}

export function useJob(
  jobId: string | null,
  options?: { pollInterval?: number },
) {
  const { data, error, isError, isLoading } = useResource<JobRow>({
    ...jobs,
    id: jobId ?? "",
    queryOptions: {
      enabled: !!jobId,
      refetchInterval: (query) => {
        const job = query.state.data?.data;
        if (job?.status === "completed") {
          return false;
        }
        return options?.pollInterval ?? 2000;
      },
    },
  });

  return {
    data: data ? rowToJob(data) : null,
    error,
    isError,
    isLoading,
  };
}

export function useSubmitJob() {
  const invalidate = useInvalidate();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (input: SubmitJobInput): Promise<SubmitJobResult> => {
      setIsPending(true);
      setError(null);

      try {
        const supabase = createClient();

        if (input.config.rotationId) {
          const { data } = await supabase
            .from("rotations")
            .select("id")
            .eq("id", input.config.rotationId)
            .single();
          if (!data) {
            throw new Error("Rotation not found");
          }
        }

        const { data, error: rpcError } = await supabase.rpc("create_job", {
          p_config: input.config as unknown as Json,
          p_iterations: input.iterations,
        });

        if (rpcError) throw rpcError;
        if (!data) throw new Error("No data returned from create_job");

        const result = data as unknown as { jobId: string; iterations: number };

        invalidate({ invalidates: ["all"], resource: "jobs" });

        return { iterations: result.iterations, jobId: result.jobId };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [invalidate],
  );

  return {
    error,
    isPending,
    mutate: (input: SubmitJobInput) => {
      submit(input).catch(() => {});
    },
    mutateAsync: submit,
  };
}

export function useUserJobs(options?: { pollInterval?: number }) {
  const { data: user } = useGetIdentity<User>();
  const userId = user?.id;

  const result = useList<JobRow>({
    ...jobs,
    filters: userId
      ? [{ field: "user_id", operator: "eq", value: userId }]
      : [],
    pagination: { currentPage: 1, pageSize: 50 },
    queryOptions: {
      enabled: !!userId,
      refetchInterval: (query) => {
        const jobsData = query.state.data?.data ?? [];
        const hasActive = jobsData.some((j) => j.status !== "completed");
        if (!hasActive) {
          return false;
        }
        return options?.pollInterval ?? 5000;
      },
    },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const rawData = (result.query.data?.data ?? []) as JobRow[];

  return {
    data: rawData.map(rowToJob),
    error: result.query.error,
    isError: result.query.isError,
    isLoading: result.query.isLoading,
  };
}

function rowToJob(row: JobRow): Job {
  return {
    chunksCompleted: row.chunks_completed,
    chunksFailed: row.chunks_failed,
    chunksTotal: row.chunks_total,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    config: row.config as unknown as SimConfig,
    createdAt: new Date(row.created_at),
    errorMessage: row.error_message,
    id: row.id,
    result: row.result as unknown as SimulationResult | null,
    status: row.status as DistributedJobStatus,
    updatedAt: new Date(row.updated_at),
  };
}
