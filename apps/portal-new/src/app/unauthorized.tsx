"use client";

import { usePathname } from "next/navigation";

import { SignInForm } from "@/components/auth";
import { PageContainer } from "@/components/common";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <PageContainer
      title="Sign In Required"
      description="Please sign in to continue"
    >
      <SignInForm redirectTo={pathname} />
    </PageContainer>
  );
}
