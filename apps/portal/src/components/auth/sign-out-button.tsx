"use client";

import { useRouter } from "next/navigation";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useSetAtom } from "jotai";
// import { signOutAtom } from "@/atoms";
import { useLogout } from "@refinedev/core";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  // TODO(refine-migration): Now using Refine logout
  // const signOut = useSetAtom(signOutAtom);
  const { mutate: logout } = useLogout();

  const handleSignOut = async () => {
    logout();
    router.push("/auth/sign-in");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
