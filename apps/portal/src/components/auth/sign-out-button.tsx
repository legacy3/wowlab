"use client";

import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { signOutAtom } from "@/atoms";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const signOut = useSetAtom(signOutAtom);

  const handleSignOut = async () => {
    await signOut();

    router.push("/sign-in");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
