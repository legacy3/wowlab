"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "./user-menu";

function AuthButtonInner() {
  const router = useRouter();
  const { data: authData } = useIsAuthenticated();

  if (authData?.authenticated) {
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
