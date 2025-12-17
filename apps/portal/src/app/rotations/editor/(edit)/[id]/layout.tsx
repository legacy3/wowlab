import { PageLayout } from "@/components/page";

export default function EditRotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Edit Rotation"
      description="Edit your rotation logic"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "Edit" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
