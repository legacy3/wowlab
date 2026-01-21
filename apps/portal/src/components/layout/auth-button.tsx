"use client";

import { useBoolean, useMount } from "ahooks";

import { Button, Skeleton } from "@/components/ui";
import { href, routes, useLocalizedRouter } from "@/lib/routing";
import { useUser } from "@/lib/state";

import { UserMenu } from "./user-menu";

export function AuthButton() {
  const router = useLocalizedRouter();
  const { data: user, isLoading } = useUser();
  const [mounted, { setTrue: setMounted }] = useBoolean(false);

  useMount(setMounted);

  if (!mounted || isLoading) {
    return <Skeleton h="9" w="20" borderRadius="l2" />;
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <Button size="sm" onClick={() => router.push(href(routes.auth.signIn))}>
      Sign In
    </Button>
  );
}
