import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  Code2,
  Eye,
  GitFork,
  Link2,
  Lock,
  Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Rotation } from "@/lib/supabase/types";

interface RotationCardProps {
  rotation: Rotation;
}

export function RotationCard({ rotation }: RotationCardProps) {
  return (
    <Link href={`/rotations/${rotation.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-base hover:underline truncate">
                  {rotation.name}
                </CardTitle>
              </div>
              <CardDescription className="truncate">
                {rotation.spec} • {rotation.patchRange}
              </CardDescription>
            </div>

            {rotation.status === "approved" && (
              <Badge variant="outline" className="border-green-500/50 shrink-0">
                <CheckCircle className="mr-1 h-3 w-3" />
                Approved
              </Badge>
            )}

            {rotation.status === "pending" && (
              <Badge
                variant="outline"
                className="border-yellow-500/50 shrink-0"
              >
                Pending
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {rotation.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {rotation.description}
            </p>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>0</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <time dateTime={rotation.updatedAt ?? undefined}>
                {rotation.updatedAt
                  ? formatDistanceToNow(new Date(rotation.updatedAt), {
                      addSuffix: true,
                    })
                  : "Unknown"}
              </time>
            </div>
          </div>

          {rotation.visibility !== "public" && (
            <div>
              <Badge variant="secondary" className="text-xs">
                {rotation.visibility === "private" ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Link2 className="mr-1 h-3 w-3" />
                    Unlisted
                  </>
                )}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
