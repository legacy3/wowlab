import { PageLayout } from "@/components/page";
import { SpellDataView } from "@/components/spell-data/spell-data-view";

export default function SpellDataPage() {
  return (
    <PageLayout
      title="Spell Data"
      description="View spell data with dynamic formatters"
      breadcrumbs={[{ label: "Spell Data", href: "/spell-data" }]}
    >
      <SpellDataView />
    </PageLayout>
  );
}
