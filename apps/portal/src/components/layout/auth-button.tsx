"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
// TODO(refine-migration): Replace with Refine useIsAuthenticated hook in Phase 4/5
// import { useAtom } from "jotai";
// import { currentUserAtom } from "@/atoms";
import { useIsAuthenticated } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "./user-menu";

function AuthButtonInner() {
  const router = useRouter();
  // TODO(refine-migration): Now using Refine auth - verify it works
  // const [user] = useAtom(currentUserAtom);
  const { data: authData } = useIsAuthenticated();
  const user = authData?.authenticated ? authData : null;

  if (user) {
    return <UserMenu />;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => router.push("/auth/sign-in")}
    >
      Sign In
    </Button>
  );
}

function AuthButtonSkeleton() {
  return <Skeleton className="h-9 w-20" />;
}

export function AuthButton() {
  return (
    <Suspense fallback={<AuthButtonSkeleton />}>
      <AuthButtonInner />
    </Suspense>
  );
}
