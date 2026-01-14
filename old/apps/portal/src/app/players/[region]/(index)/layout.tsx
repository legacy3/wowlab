import { PageLayout } from "@/components/page";

interface Props {
  children: React.ReactNode;
  params: Promise<{ region: string }>;
}

export default async function RegionLayout({ children, params }: Props) {
  const { region } = await params;

  return (
    <PageLayout
      title={`${region.toUpperCase()} Players`}
      description={`Browse players from the ${region.toUpperCase()} region.`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Players", href: "/players" },
        { label: region.toUpperCase() },
      ]}
    >
      {children}
    </PageLayout>
  );
}
