"use client";

import { useGetIdentity, useOne } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/account/user-avatar";
import { UserHandle } from "@/components/ui/user-handle";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";

interface UserProfileProps {
  userId: string;
}

function UserProfileInner({ userId }: UserProfileProps) {
  const { data: identity } = useGetIdentity<{ id: string }>();
  const {
    result,
    query: { isLoading },
  } = useOne<Profile>({
    resource: "user_profiles",
    id: userId,
  });

  const currentUserId = identity?.id;
  const user = result;

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>
            The requested user profile could not be found.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
              <CardTitle>
                <UserHandle handle={user.handle} linkTo={false} />
              </CardTitle>
              {isOwnProfile && <Badge variant="secondary">You</Badge>}
            </div>
            <CardDescription>
              Member since {formatDate(user.createdAt, "MMMM yyyy")}
            </CardDescription>
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
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserProfile({ userId }: UserProfileProps) {
  return <UserProfileInner userId={userId} />;
}
