"use client";

import { usePathname } from "next/navigation";
import { Container } from "styled-system/jsx";

import { SignInForm } from "@/components/auth";
import { PageHeader } from "@/components/common";
import { Group } from "@/components/ui";
import { routes } from "@/lib/routing";

export default function Unauthorized() {
  const pathname = usePathname();

  return (
    <Container maxW="7xl" py="8">
      <Group direction="column" gap="6">
        <PageHeader route={routes.unauthorized} />
        <SignInForm redirectTo={pathname} />
      </Group>
    </Container>
  );
}
