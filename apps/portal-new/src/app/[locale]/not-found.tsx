import { PageContainer } from "@/components/common";
import { Text } from "@/components/ui";

export default function NotFound() {
  return (
    <PageContainer
      title="Not Found"
      description="The page you're looking for doesn't exist"
    >
      <Text color="fg.muted">Check the URL or go back to the home page.</Text>
    </PageContainer>
  );
}
