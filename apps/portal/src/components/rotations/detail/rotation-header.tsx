"use client";

import { memo } from "react";
import Link from "next/link";
import {
  Edit,
  GitFork,
  Globe,
  Lock,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/account/user-avatar";
import { UserHandle } from "@/components/ui/user-handle";
import { SpecLabel } from "@/components/ui/spec-label";
import type { Rotation, Profile } from "@/lib/supabase/types";

interface RotationHeaderProps {
  rotation: Rotation;
  author?: Profile;
  isOwner: boolean;
}

export function RotationHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

export const RotationHeader = memo(function RotationHeader({
  rotation,
  author,
  isOwner,
}: RotationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {author && <UserAvatar user={author} className="h-12 w-12" />}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{rotation.name}</h1>
            {rotation.isPublic ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserHandle handle={author?.handle ?? "unknown"} size="sm" />
            <span>·</span>
            <SpecLabel specId={rotation.specId} size="sm" showChevron showIcon />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href={`/rotations/editor?fork=${rotation.id}`}>
            <GitFork className="mr-2 h-4 w-4" />
            Fork
          </Link>
        </Button>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/rotations/editor/${rotation.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
});
