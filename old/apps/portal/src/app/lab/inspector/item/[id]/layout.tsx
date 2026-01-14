import { PageLayout } from "@/components/page";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ItemInspectorLayout({ children, params }: Props) {
  const { id } = await params;

  return (
    <PageLayout
      title="Item Inspector"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Inspector", href: "/lab/inspector/search" },
        { label: `Item #${id}` },
      ]}
    >
      {children}
    </PageLayout>
  );
}
