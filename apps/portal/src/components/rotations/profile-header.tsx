import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/account/user-avatar";
import { Code2, GitFork, Star } from "lucide-react";
import type { UserIdentity } from "@/lib/supabase/types";

interface ProfileHeaderProps {
  user: UserIdentity;
  rotationCount?: number;
}

export function ProfileHeader({ user, rotationCount = 0 }: ProfileHeaderProps) {
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <UserAvatar
            user={user}
            className="h-24 w-24"
            fallbackClassName="text-2xl"
          />

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">@{user.handle ?? "user"}</h1>
              {user.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.email}
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
