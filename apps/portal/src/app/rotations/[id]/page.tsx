import { createClient } from "@/lib/supabase/server";
import { PageLayout } from "@/components/page";
import { RotationDetail } from "@/components/rotations/rotation-detail-page";
import { notFound } from "next/navigation";

interface RotationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RotationPage({ params }: RotationPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch rotation and profile
  const { data: rotation } = await supabase
    .from("rotations")
    .select("*, profiles!rotations_user_id_fkey(handle)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!rotation) {
    notFound();
  }

  const profile = Array.isArray(rotation.profiles)
    ? rotation.profiles[0]
    : rotation.profiles;
  const authorHandle = profile?.handle || "unknown";

  return (
    <PageLayout
      title={rotation.name}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Rotations", href: "/rotations" },
        { label: rotation.name },
      ]}
    >
      <RotationDetail namespace={authorHandle} slug={rotation.slug} />
    </PageLayout>
  );
}
