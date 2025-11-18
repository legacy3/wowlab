"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { supabaseClientAtom, sessionAtom } from "@/atoms";

export function AuthSync() {
  const [supabase] = useAtom(supabaseClientAtom);
  const refreshSession = useSetAtom(sessionAtom);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshSession]);

  return null;
}
