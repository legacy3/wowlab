import { PageLayout } from "@/components/page";
import { DropOptimizerContent } from "@/components/drop-optimizer";

export default function DropOptimizerPage() {
  return (
    <PageLayout
      title="Drop Optimizer"
      description="Calculate drop priorities from dungeons and raids"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Drop Optimizer" }]}
    >
      <DropOptimizerContent />
    </PageLayout>
  );
}
