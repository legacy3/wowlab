import { PageLayout } from "@/components/page";
import { TreeSkeleton } from "@/components/ui/skeleton";

export default function DocsLoading() {
  return (
    <PageLayout
      title="Documentation"
      description="Technical documentation for WoW Lab"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Docs" }]}
    >
      <div className="max-w-xl">
        <TreeSkeleton itemCount={6} />
      </div>
    </PageLayout>
  );
}
