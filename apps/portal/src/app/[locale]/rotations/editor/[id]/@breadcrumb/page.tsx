import type { RotationsRow } from "@/lib/editor";

import { PageBreadcrumbs } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditorBreadcrumb({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rotation } = await supabase
    .from("rotations")
    .select("name")
    .eq("id", id)
    .single();

  const name =
    (rotation as Pick<RotationsRow, "name"> | null)?.name ?? "Edit Rotation";

  return (
    <PageBreadcrumbs
      items={breadcrumb(
        routes.home,
        routes.rotations.index,
        routes.rotations.editor.index,
        name,
      )}
    />
  );
}
