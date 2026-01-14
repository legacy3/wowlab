import { docsIndex } from "@/lib/docs";
import { DocTree } from "@/components/docs/doc-tree";

export default function DocsPage() {
  return (
    <div className="max-w-xl">
      {docsIndex.length === 0 ? (
        <p className="text-muted-foreground">No documentation yet.</p>
      ) : (
        <DocTree items={docsIndex} />
      )}
    </div>
  );
}
