"use client";

import { Container } from "styled-system/jsx";

import { PageHeader } from "@/components/common";
import { Button, Group, Text } from "@/components/ui";
import { routes } from "@/lib/routing";

export default function Error({
  error,
  reset,
}: {
  error: { digest?: string } & Error;
  reset: () => void;
}) {
  return (
    <Container maxW="7xl" py="8">
      <Group direction="column" gap="6">
        <PageHeader route={routes.error} />
        <Group direction="column" gap="4">
          <Text color="fg.muted">{error.message}</Text>
          <Button onClick={reset}>Try again</Button>
        </Group>
      </Group>
    </Container>
  );
}
