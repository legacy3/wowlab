import { PageLayout } from "@/components/page";
import { EditorContent } from "@/components/editor";

export default function EditorPage() {
  return (
    <PageLayout
      title="Rotation Editor"
      description="Create and edit custom rotation logic"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Editor" }]}
    >
      <EditorContent />
    </PageLayout>
  );
}
