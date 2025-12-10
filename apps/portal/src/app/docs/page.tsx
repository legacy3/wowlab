import { PageLayout } from "@/components/page";
import { docsIndex } from "@/lib/docs";
import { DocTree } from "@/components/docs/doc-tree";

export default function DocsPage() {
  return (
    <PageLayout
      title="Documentation"
      description="Technical documentation for WoW Lab"
      breadcrumbs={[{ label: "Docs", href: "/docs" }]}
    >
      <div className="max-w-xl">
        {docsIndex.length === 0 ? (
          <p className="text-muted-foreground">No documentation yet.</p>
        ) : (
          <DocTree items={docsIndex} />
        )}
      </div>
    </PageLayout>
  );
}
