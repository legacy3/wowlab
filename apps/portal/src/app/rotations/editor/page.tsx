import { PageLayout } from "@/components/page";
import { EditorContent } from "@/components/rotations/editor";

type Props = {
  searchParams: Promise<{ source?: string }>;
};

export default async function RotationEditorPage({ searchParams }: Props) {
  const { source } = await searchParams;

  return (
    <PageLayout
      title="Rotation Editor"
      description="Create and edit custom rotation logic"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "Editor" },
      ]}
    >
      <EditorContent sourceId={source} />
    </PageLayout>
  );
}
