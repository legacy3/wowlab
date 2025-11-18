import { PageLayout } from "@/components/page";
import { WorkbenchDashboard } from "@/components/workbench/workbench-dashboard";

export default function WorkbenchPage() {
  return (
    <PageLayout
      title="Workbench"
      description="Experimental simulation workspace"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Workbench" }]}
    >
      <WorkbenchDashboard />
    </PageLayout>
  );
}
