import { PageLayout } from "@/components/page";
import { RotationEditor } from "@/components/rotations/editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRotationPage({ params }: Props) {
  const { id } = await params;

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
      <RotationEditor rotationId={id} />
    </PageLayout>
  );
}
