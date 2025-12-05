"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  profile: Profile;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  profile,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = profile.handle[0].toUpperCase();

  return (
    <Avatar className={cn(className)}>
      {profile.avatarUrl && (
        <AvatarImage src={profile.avatarUrl} alt={`@${profile.handle}`} />
      )}
      <AvatarFallback className={cn(fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
