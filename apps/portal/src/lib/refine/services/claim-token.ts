"use client";

import { useInvalidate } from "@refinedev/core";
import { useMemoizedFn, useMount, useSetState } from "ahooks";

import { createClient } from "@/lib/supabase/client";

interface ClaimTokenState {
  isLoading: boolean;
  isRegenerating: boolean;
  token: string | null;
}

export function useClaimToken() {
  const invalidate = useInvalidate();
  const [state, setState] = useSetState<ClaimTokenState>({
    isLoading: true,
    isRegenerating: false,
    token: null,
  });

  const fetchToken = useMemoizedFn(async () => {
    setState({ isLoading: true });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("claim_token")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      setState({
        isLoading: false,
        isRegenerating: false,
        token: data.claim_token,
      });
    } catch {
      setState({ isLoading: false });
    }
  });

  useMount(fetchToken);

  const regenerate = useMemoizedFn(async () => {
    setState({ isRegenerating: true });

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("regenerate_claim_token");

      if (error) {
        throw error;
      }

      setState({
        isLoading: false,
        isRegenerating: false,
        token: data as string,
      });

      invalidate({ invalidates: ["all"], resource: "nodes" });
    } catch {
      setState({ isRegenerating: false });
    }
  });

  return {
    isLoading: state.isLoading,
    isRegenerating: state.isRegenerating,
    regenerate,
    token: state.token,
  };
}
