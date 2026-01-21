import { Compass } from "lucide-react";
import NextLink from "next/link";
import { Container } from "styled-system/jsx";

import { Button, Empty } from "@/components/ui";

export default function NotFound() {
  return (
    <Container maxW="7xl" py="16">
      <Empty.Root size="lg" variant="plain">
        <Empty.Icon>
          <Compass />
        </Empty.Icon>
        <Empty.Content>
          <Empty.Title>Page Not Found</Empty.Title>
          <Empty.Description>
            The page you're looking for doesn't exist.
          </Empty.Description>
        </Empty.Content>
        <Empty.Action>
          <Button asChild>
            <NextLink href="/">Go Home</NextLink>
          </Button>
        </Empty.Action>
      </Empty.Root>
    </Container>
  );
}
