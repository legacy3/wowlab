import { PageLayout } from "@/components/page";
import { EditorContent } from "@/components/rotations/editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRotationPage(_props: Props) {
  return (
    <PageLayout
      title="Edit Rotation"
      description="Edit your rotation logic"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "Editor" },
      ]}
    >
      <EditorContent />
    </PageLayout>
  );
}
