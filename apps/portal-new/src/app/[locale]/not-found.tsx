import { Container } from "styled-system/jsx";

import { PageHeader } from "@/components/common";
import { Group, Text } from "@/components/ui";
import { routes } from "@/lib/routing";

export default function NotFound() {
  return (
    <Container maxW="7xl" py="8">
      <Group direction="column" gap="6">
        <PageHeader route={routes.notFound} />
        <Text color="fg.muted">Check the URL or go back to the home page.</Text>
      </Group>
    </Container>
  );
}
