"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom } from "jotai";
// import { currentUserAtom } from "@/atoms";
import { useIsAuthenticated } from "@refinedev/core";
import { SignInForm } from "./sign-in-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SignInInner() {
  const router = useRouter();
  // TODO(refine-migration): Now using Refine auth
  // const [user] = useAtom(currentUserAtom);
  const { data: authData } = useIsAuthenticated();
  const user = authData?.authenticated ? authData : null;

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return <SignInForm />;
}

function SignInSkeleton() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col space-y-2 text-center items-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-1">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SignIn() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInInner />
    </Suspense>
  );
}
