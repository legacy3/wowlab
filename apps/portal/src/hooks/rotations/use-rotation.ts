import { useOne } from "@refinedev/core";
import type { Rotation } from "@/lib/supabase/types";

export function useRotation(id: string | undefined) {
  const {
    result: rotation,
    query: { isLoading, isError, refetch },
  } = useOne<Rotation>({
    resource: "rotations",
    id: id as string,
    queryOptions: {
      enabled: !!id,
    },
  });

  return { rotation, isLoading, isError, refetch };
}
