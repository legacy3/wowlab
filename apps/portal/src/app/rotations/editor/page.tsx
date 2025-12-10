import { PageLayout } from "@/components/page";
import { RotationEditor } from "@/components/rotations/editor";

type Props = {
  searchParams: Promise<{ fork?: string }>;
};

export default async function RotationEditorPage({ searchParams }: Props) {
  const { fork } = await searchParams;

  return (
    <PageLayout
      title="New Rotation"
      description="Create a new custom rotation"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: "New" },
      ]}
    >
      <RotationEditor forkSourceId={fork} />
    </PageLayout>
  );
}
