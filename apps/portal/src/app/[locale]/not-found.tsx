import { Compass } from "lucide-react";
import { getExtracted } from "next-intl/server";
import NextLink from "next/link";
import { Container } from "styled-system/jsx";

import { Button, Empty } from "@/components/ui";
import { routes } from "@/lib/routing";

export default async function NotFound() {
  const t = await getExtracted();

  return (
    <Container maxW="7xl" py="16">
      <Empty.Root size="lg" variant="plain">
        <Empty.Icon>
          <Compass />
        </Empty.Icon>
        <Empty.Content>
          <Empty.Title>{t("Page not found")}</Empty.Title>
          <Empty.Description>
            {t("The page you're looking for doesn't exist or has been moved.")}
          </Empty.Description>
        </Empty.Content>
        <Empty.Action>
          <Button asChild>
            <NextLink href={routes.home.path}>{t("Go home")}</NextLink>
          </Button>
        </Empty.Action>
      </Empty.Root>
    </Container>
  );
}
