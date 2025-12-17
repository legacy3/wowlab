"use client";

import { redirect } from "next/navigation";
import { useIsAuthenticated } from "@refinedev/core";
import { SettingsOverview } from "@/components/account/settings-overview";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { data: auth, isLoading } = useIsAuthenticated();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (!auth?.authenticated) {
    redirect("/auth/sign-in");
  }

  return <SettingsOverview />;
}
