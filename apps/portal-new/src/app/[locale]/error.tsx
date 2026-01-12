"use client";

import { PageContainer } from "@/components/common";
import { Button, Group, Text } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: { digest?: string } & Error;
  reset: () => void;
}) {
  return (
    <PageContainer title="Error" description="Something went wrong">
      <Group direction="column" gap="4">
        <Text color="fg.muted">{error.message}</Text>
        <Button onClick={reset}>Try again</Button>
      </Group>
    </PageContainer>
  );
}
