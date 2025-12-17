import { PageLayout } from "@/components/page";

type Props = {
  children: React.ReactNode;
  params: Promise<{ handle: string }>;
};

export default async function UserProfileLayout({ children, params }: Props) {
  const { handle } = await params;

  return (
    <PageLayout
      title={`@${handle}`}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: `@${handle}` }]}
    >
      {children}
    </PageLayout>
  );
}
