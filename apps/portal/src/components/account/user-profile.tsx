"use client";

import { Suspense } from "react";
import { useGetIdentity } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/account/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileInnerProps {
  userId: string;
}

function UserProfileInner({ userId }: UserProfileInnerProps) {
  const { data: identity } = useGetIdentity<{ id: string }>();
  const currentUserId = identity?.id;
  // TODO: Fetch user using useOne hook once data migration is complete
  const user = {
    id: userId,
    handle: "user",
    email: "",
    avatarUrl: null as string | null,
  };

  const isOwnProfile = currentUserId === user.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <UserAvatar
            user={user}
            className="h-16 w-16"
            fallbackClassName="text-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>@{user.handle}</CardTitle>
              {isOwnProfile && <Badge variant="secondary">You</Badge>}
            </div>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              User ID
            </h3>
            <p className="text-sm font-mono mt-1">{user.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserProfile({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfileInner userId={userId} />
    </Suspense>
  );
}
