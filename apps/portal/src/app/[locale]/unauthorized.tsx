"use client";

import { usePathname } from "next/navigation";
import { Flex } from "styled-system/jsx";

import { SignInForm } from "@/components/auth";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <Flex justify="center" py="12">
      <SignInForm redirectTo={pathname} />
    </Flex>
  );
}
