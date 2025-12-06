"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom, useSetAtom } from "jotai";
// import { currentUserAtom, currentProfileAtom, signOutAtom } from "@/atoms";
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
import { Skeleton } from "@/components/ui/skeleton";
import { User, Settings, LogOut, FileCode, History } from "lucide-react";

function UserMenuInner() {
  const router = useRouter();
  // TODO(refine-migration): Now using Refine auth hooks
  // const [user] = useAtom(currentUserAtom);
  // const [profile] = useAtom(currentProfileAtom);
  // const signOut = useSetAtom(signOutAtom);
  const { data: identity } = useGetIdentity<{
    id: string;
    email: string;
    handle: string;
  }>();
  const { mutate: logout } = useLogout();

  // Map identity to user/profile shape
  const user = identity ? { id: identity.id, email: identity.email } : null;
  const profile = identity
    ? {
        id: identity.id,
        handle: identity.handle || "user",
        email: identity.email,
        avatarUrl: null as string | null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  const handleSignOut = async () => {
    logout();
    router.push("/auth/sign-in");
    router.refresh();
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <UserAvatar profile={profile} className="h-9 w-9" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              @{profile.handle}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
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
