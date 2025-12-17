import { PageLayout } from "@/components/page";

export default function CreateRotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="New Rotation"
      description="Create a new custom rotation"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "New" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
