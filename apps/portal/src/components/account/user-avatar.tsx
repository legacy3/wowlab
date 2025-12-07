"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    handle?: string;
    avatarUrl?: string | null;
  };
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = user.handle?.[0]?.toUpperCase() ?? "?";

  return (
    <Avatar className={cn(className)}>
      {user.avatarUrl && (
        <AvatarImage src={user.avatarUrl} alt={`@${user.handle}`} />
      )}
      <AvatarFallback className={cn(fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
