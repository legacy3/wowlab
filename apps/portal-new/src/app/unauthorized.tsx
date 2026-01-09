"use client";

import { usePathname } from "next/navigation";

import { SignIn } from "@/components/auth";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <div style={{ padding: "3rem 1rem" }}>
      <SignIn redirectTo={pathname} />
    </div>
  );
}
