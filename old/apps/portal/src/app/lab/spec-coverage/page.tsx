import { unauthorized } from "next/navigation";
import { SpecCoverageContent } from "@/components/lab/spec-coverage";
import { createClient } from "@/lib/supabase/server";

export default async function SpecCoverageRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

  return <SpecCoverageContent />;
}
