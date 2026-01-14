"use client";

import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SignInProps {
  redirectTo?: string;
}

function SignInInner({ redirectTo }: SignInProps) {
  return <SignInForm redirectTo={redirectTo} />;
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
        <CardHeader className="space-y-1.5">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SignIn({ redirectTo }: SignInProps) {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInInner redirectTo={redirectTo} />
    </Suspense>
  );
}
