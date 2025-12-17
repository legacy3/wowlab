import { unauthorized } from "next/navigation";
import { RotationEditor } from "@/components/rotations/editor";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditRotationPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

  return <RotationEditor rotationId={id} />;
}
