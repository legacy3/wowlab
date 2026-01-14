"use client";

import { redirect } from "next/navigation";
import { useIsAuthenticated } from "@refinedev/core";
import { SignIn } from "@/components/auth/sign-in-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignInPage() {
  const { data: auth, isLoading } = useIsAuthenticated();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (auth?.authenticated) {
    redirect("/account");
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <SignIn />
    </div>
  );
}
