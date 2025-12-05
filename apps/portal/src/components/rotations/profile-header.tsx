import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/account/user-avatar";
import { Calendar, Code2, GitFork, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Profile } from "@/lib/supabase/types";

interface ProfileHeaderProps {
  profile: Profile;
  rotationCount?: number;
}

export function ProfileHeader({
  profile,
  rotationCount = 0,
}: ProfileHeaderProps) {
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <UserAvatar
            profile={profile}
            className="h-24 w-24"
            fallbackClassName="text-2xl"
          />

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">@{profile.handle}</h1>
              {profile.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.email}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{rotationCount}</span>
                <span className="text-muted-foreground">
                  {rotationCount === 1 ? "Rotation" : "Rotations"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">0</span>
                <span className="text-muted-foreground">Forks</span>
              </div>

              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">0</span>
                <span className="text-muted-foreground">Stars</span>
              </div>

              {profile.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Joined{" "}
                    {formatDistanceToNow(new Date(profile.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
