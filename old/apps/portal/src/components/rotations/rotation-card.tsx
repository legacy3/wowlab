"use client";

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
import { Clock, Code2, GitFork, Lock } from "lucide-react";
import type { Rotation } from "@/lib/supabase/types";
import { formatRelativeToNow } from "@/lib/format";
import { SpecLabel } from "@/components/ui/spec-label";

interface RotationCardProps {
  rotation: Rotation;
}

export function RotationCard({ rotation }: RotationCardProps) {
  return (
    <Link href={`/rotations/${rotation.id}`}>
      <Card className="hover:border-primary/50 cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="h-4 w-4 text-primary shrink-0" />
                <CardTitle className="text-base hover:underline truncate">
                  {rotation.name}
                </CardTitle>
              </div>
              <CardDescription className="truncate">
                <SpecLabel
                  specId={rotation.specId}
                  size="sm"
                  showIcon={false}
                />
              </CardDescription>
            </div>

            {rotation.forkedFromId && (
              <Badge variant="outline" className="border-blue-500/50 shrink-0">
                <GitFork className="mr-1 h-3 w-3" />
                Fork
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
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <time dateTime={rotation.updatedAt}>
                {formatRelativeToNow(rotation.updatedAt)}
              </time>
            </div>

            {!rotation.isPublic && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="mr-1 h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
