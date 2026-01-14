import { PageLayout } from "@/components/page";

export default function RotationsBrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Browse Rotations"
      description="Explore community-created rotation simulations"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Rotations" }]}
    >
      {children}
    </PageLayout>
  );
}
