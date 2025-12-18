"use client";

import { usePathname } from "next/navigation";
import { SignIn } from "@/components/auth/sign-in-content";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center py-8">
      <SignIn redirectTo={pathname} />
    </div>
  );
}
