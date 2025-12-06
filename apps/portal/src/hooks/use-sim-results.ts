import { useList, useCreate } from "@refinedev/core";
import type { SimResult } from "@/lib/supabase/types";

export function useSimResults(rotationId: string | undefined) {
  const {
    result: simResults,
    query: { isLoading, isError, refetch },
  } = useList<SimResult>({
    resource: "rotation_sim_results",
    filters: [{ field: "rotationId", operator: "eq", value: rotationId }],
    sorters: [{ field: "createdAt", order: "desc" }],
    pagination: { pageSize: 20 },
    queryOptions: {
      enabled: !!rotationId,
    },
  });

  return {
    simResults: simResults?.data ?? [],
    total: simResults?.total ?? 0,
    isLoading,
    isError,
    refetch,
  };
}

export type SimResultInput = Omit<SimResult, "id" | "createdAt">;

export function useSaveSimResult() {
  const { mutate, mutateAsync, mutation } = useCreate<SimResult>();
  const isLoading = mutation.isPending;

  const saveResult = (
    rotationId: string,
    result: Omit<SimResultInput, "rotationId">,
  ) => {
    mutate({
      resource: "rotation_sim_results",
      values: {
        rotationId,
        ...result,
      },
    });
  };

  const saveResultAsync = async (
    rotationId: string,
    result: Omit<SimResultInput, "rotationId">,
  ) => {
    return mutateAsync({
      resource: "rotation_sim_results",
      values: {
        rotationId,
        ...result,
      },
    });
  };

  return { saveResult, saveResultAsync, isLoading };
}
