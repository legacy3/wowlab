"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SimulationResult } from "@/lib/engine";

import { createClient, type Row } from "@/lib/supabase";

export type DistributedJobStatus = "pending" | "running" | "completed";

export interface Job {
  completedAt: string | null;
  completedIterations: number;
  configHash: string;
  createdAt: string;
  id: string;
  result: SimulationResult | null;
  status: DistributedJobStatus;
  totalIterations: number;
  userId: string;
}

export interface SimConfig {
  duration: number;
  player: {
    name: string;
    spec: string;
    stats: {
      strength: number;
      agility: number;
      intellect: number;
      stamina: number;
      crit_rating: number;
      haste_rating: number;
      mastery_rating: number;
      versatility_rating: number;
    };
  };
  rotationId?: string;
  target: {
    level_diff: number;
    max_health: number;
    armor: number;
  };
}

export interface SubmitJobInput {
  config: SimConfig;
  iterations: number;
}

export interface SubmitJobResult {
  chunks: number;
  jobId: string;
}

interface ConfigUpsertResponse {
  hash: string;
  success: boolean;
}

interface JobCreateResponse {
  chunks: number;
  jobId: string;
  queued: boolean;
}

type JobRow = Row<"jobs">;

export function useJob(
  jobId: string | null,
  options?: { pollInterval?: number },
) {
  const supabase = createClient();

  return useQuery({
    enabled: !!jobId,
    queryFn: async (): Promise<Job | null> => {
      if (!jobId) {
        return null;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return rowToJob(data);
    },
    queryKey: ["jobs", jobId],
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.status === "completed") {
        return false;
      }
      return options?.pollInterval ?? 2000;
    },
  });
}

export function useSubmitJob() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitJobInput): Promise<SubmitJobResult> => {
      const { data: configData, error: configError } =
        await supabase.functions.invoke<ConfigUpsertResponse>("config-upsert", {
          body: { config: input.config },
        });

      if (configError || !configData) {
        throw new Error(configError?.message ?? "Failed to upload config");
      }

      const { data: jobData, error: jobError } =
        await supabase.functions.invoke<JobCreateResponse>("job-create", {
          body: { configHash: configData.hash, iterations: input.iterations },
        });

      if (jobError || !jobData) {
        throw new Error(jobError?.message ?? "Failed to create job");
      }

      return { chunks: jobData.chunks, jobId: jobData.jobId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUserJobs(options?: { pollInterval?: number }) {
  const supabase = createClient();

  return useQuery({
    queryFn: async (): Promise<Job[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data ?? []).map(rowToJob);
    },
    queryKey: ["jobs", "user"],
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      const hasActive = jobs.some((j) => j.status !== "completed");
      if (!hasActive) {
        return false;
      }
      return options?.pollInterval ?? 5000;
    },
  });
}

function rowToJob(row: JobRow): Job {
  return {
    completedAt: row.completed_at,
    completedIterations: row.completed_iterations,
    configHash: row.config_hash,
    createdAt: row.created_at,
    id: row.id,
    result: row.result as SimulationResult | null,
    status: row.status as DistributedJobStatus,
    totalIterations: row.total_iterations,
    userId: row.user_id,
  };
}
