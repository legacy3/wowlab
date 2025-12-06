"use client";

import { Suspense } from "react";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom } from "jotai";
// import { profileByIdAtomFamily, currentUserAtom } from "@/atoms";
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
  // TODO(refine-migration): Now using Refine data hooks
  // const [currentUser] = useAtom(currentUserAtom);
  // const profileAtom = useMemo(() => profileByIdAtomFamily(userId), [userId]);
  // const [profile] = useAtom(profileAtom);
  const { data: identity } = useGetIdentity<{ id: string }>();
  // TODO(refine-migration): useOne returns different structure, fix in Phase 4/5
  // const { result: profileData } = useOne({
  //   resource: "profiles",
  //   id: userId,
  // });
  const currentUser = identity ? { id: identity.id } : null;
  // Temporary placeholder until Refine migration is complete
  const profile = {
    id: userId,
    handle: "user",
    email: "",
    avatarUrl: null as string | null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>
            The requested user profile could not be found
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <UserAvatar
            profile={profile}
            className="h-16 w-16"
            fallbackClassName="text-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>@{profile.handle}</CardTitle>
              {isOwnProfile && <Badge variant="secondary">You</Badge>}
            </div>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              User ID
            </h3>
            <p className="text-sm font-mono mt-1">{profile.id}</p>
          </div>
          {profile.createdAt && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Member Since
              </h3>
              <p className="text-sm mt-1">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
          {profile.updatedAt && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h3>
              <p className="text-sm mt-1">
                {new Date(profile.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
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
