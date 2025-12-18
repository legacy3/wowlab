"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/account/user-avatar";
import { UserHandle } from "@/components/ui/user-handle";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, LogOut, FileCode, History } from "lucide-react";
import type { UserIdentity } from "@/lib/supabase/types";

function UserMenuInner() {
  const router = useRouter();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  const handleSignOut = async () => {
    logout();
    router.push("/auth/sign-in");
    router.refresh();
  };

  if (!identity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <UserAvatar user={identity} className="h-9 w-9" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel
          className="flex cursor-pointer items-center rounded-sm py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => router.push("/account")}
        >
          <User className="mr-2 h-4 w-4" />
          <UserHandle handle={identity.handle ?? "user"} linkTo={false} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account?tab=rotations")}>
          <FileCode className="mr-2 h-4 w-4" />
          <span>My Rotations</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account?tab=history")}>
          <History className="mr-2 h-4 w-4" />
          <span>History</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenuSkeleton() {
  return <Skeleton className="h-9 w-9 rounded-full" />;
}

export function UserMenu() {
  return (
    <Suspense fallback={<UserMenuSkeleton />}>
      <UserMenuInner />
    </Suspense>
  );
}
