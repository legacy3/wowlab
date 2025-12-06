"use client";

import { useRouter } from "next/navigation";
import { useLogout } from "@refinedev/core";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
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
