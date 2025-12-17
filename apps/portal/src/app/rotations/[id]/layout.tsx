import { PageLayout } from "@/components/page";

export default function RotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Rotation"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "View" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
