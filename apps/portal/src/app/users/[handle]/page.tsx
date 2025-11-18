import { PageLayout } from "@/components/page";
import { NamespacePage } from "@/components/rotations/namespace-page";

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { handle } = await params;

  return (
    <PageLayout
      title={`@${handle}`}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: `@${handle}` }]}
    >
      <NamespacePage namespace={handle} />
    </PageLayout>
  );
}
