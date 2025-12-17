import { unauthorized } from "next/navigation";
import { RotationEditor } from "@/components/rotations/editor";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ fork?: string }>;
};

export default async function RotationEditorPage({ searchParams }: Props) {
  const { fork } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

  return <RotationEditor forkSourceId={fork} />;
}
