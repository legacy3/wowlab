import { Compass } from "lucide-react";
import { useIntlayer } from "next-intlayer/server";
import NextLink from "next/link";
import { Container } from "styled-system/jsx";

import { Button, Empty } from "@/components/ui";
import { routes } from "@/lib/routing";

export default function NotFound() {
  const content = useIntlayer("not-found");

  return (
    <Container maxW="7xl" py="16">
      <Empty.Root size="lg" variant="plain">
        <Empty.Icon>
          <Compass />
        </Empty.Icon>
        <Empty.Content>
          <Empty.Title>{content.pageNotFound}</Empty.Title>
          <Empty.Description>{content.description}</Empty.Description>
        </Empty.Content>
        <Empty.Action>
          <Button asChild>
            <NextLink href={routes.home.path}>{content.goHome}</NextLink>
          </Button>
        </Empty.Action>
      </Empty.Root>
    </Container>
  );
}
