import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShortUrlRedirect({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("short_urls")
    .select("targetUrl")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  redirect(data.targetUrl);
}
