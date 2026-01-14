"use client";

import Link from "next/link";
import { Plus, FileCode, Code2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SecretText } from "@/components/ui/secret-field";
import { UserAvatar } from "./user-avatar";
import { UserHandle } from "@/components/ui/user-handle";
import { UserRotationsTable } from "@/components/rotations/user-rotations-table";
import type { UserIdentity, Rotation } from "@/lib/supabase/types";

type Props = {
  user: UserIdentity;
  rotations: Rotation[];
};

function ProfileStats({ rotationCount }: { rotationCount: number }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Code2 className="h-4 w-4 text-muted-foreground" />
      <span className="tabular-nums font-medium">{rotationCount}</span>
      <span className="text-muted-foreground">
        {rotationCount === 1 ? "rotation" : "rotations"}
      </span>
    </div>
  );
}

function ProfileSection({
  user,
  rotationCount,
}: {
  user: UserIdentity;
  rotationCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <UserAvatar
          user={user}
          className="h-14 w-14"
          fallbackClassName="text-lg"
        />
        <div className="space-y-1">
          <UserHandle
            handle={user.handle ?? "user"}
            linkTo={false}
            size="xl"
            className="font-semibold"
          />
          {user.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <SecretText value={user.email} hiddenLength={24} />
            </div>
          )}
        </div>
      </div>
      <ProfileStats rotationCount={rotationCount} />
    </div>
  );
}

function RotationsSection({ rotations }: { rotations: Rotation[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Rotations</h2>
        <Button asChild size="sm">
          <Link href="/rotations/editor">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Link>
        </Button>
      </div>

      {rotations.length > 0 ? (
        <UserRotationsTable rotations={rotations} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileCode className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No rotations yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first rotation to get started
            </p>
            <Button asChild size="sm">
              <Link href="/rotations/editor">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Rotation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AccountOverview({ user, rotations }: Props) {
  return (
    <div className="space-y-6">
      <ProfileSection user={user} rotationCount={rotations.length} />
      <RotationsSection rotations={rotations} />
    </div>
  );
}

export function AccountOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}
