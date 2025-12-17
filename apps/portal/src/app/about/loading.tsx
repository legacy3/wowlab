import { PageLayout } from "@/components/page";
import { TabsSkeleton, ProseSkeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <PageLayout
      title="About"
      description="What is WoW Lab and how does it work"
      breadcrumbs={[{ label: "About", href: "/about" }]}
    >
      <div className="flex flex-col gap-4">
        <TabsSkeleton tabCount={3} />
        <ProseSkeleton />
      </div>
    </PageLayout>
  );
}
