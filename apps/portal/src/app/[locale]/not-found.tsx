import { Compass } from "lucide-react";
import { Container } from "styled-system/jsx";

import { Button, Empty, Link } from "@/components/ui";
import { href, routes } from "@/lib/routing";

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
            The page you&apos;re looking for doesn&apos;t exist.
          </Empty.Description>
        </Empty.Content>
        <Empty.Action>
          <Button asChild>
            <Link href={href(routes.home)}>Go Home</Link>
          </Button>
        </Empty.Action>
      </Empty.Root>
    </Container>
  );
}
