"use client";

import { useRouter } from "next/navigation";

import { Button, Skeleton } from "@/components/ui";
import { routes } from "@/lib/routes";
import { useUser } from "@/lib/state";

import { UserMenu } from "./user-menu";

export function AuthButton() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <Skeleton h="9" w="20" borderRadius="l2" />;
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <Button size="sm" onClick={() => router.push(routes.auth.signIn)}>
      Sign In
    </Button>
  );
}
