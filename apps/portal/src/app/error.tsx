"use client";

import { useExtracted } from "next-intl";
import { Container } from "styled-system/jsx";

import { PageHeader } from "@/components/common";
import { Button, ErrorBox, Group } from "@/components/ui";
import { routes } from "@/lib/routing";

export default function Error({
  error,
  reset,
}: {
  error: { digest?: string } & Error;
  reset: () => void;
}) {
  const t = useExtracted();

  return (
    <Container maxW="7xl" py="8">
      <Group direction="column" gap="6">
        <PageHeader route={routes.error} />
        <Group direction="column" gap="4">
          <ErrorBox>{error.message}</ErrorBox>
          <Button onClick={reset}>{t("Try again")}</Button>
        </Group>
      </Group>
    </Container>
  );
}
