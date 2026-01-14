import { formatDate } from "@/lib/format";
import { createRotationOgImage, createSectionOgImage, ogSize } from "@/lib/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "WoW Lab Rotation";
export const size = ogSize;
export const contentType = "image/png";
// TODO: Call revalidatePath in rotation update action for immediate invalidation
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rotation } = await supabase
    .from("rotations")
    .select("name, description, specId, userId, currentVersion, updatedAt")
    .eq("id", id)
    .single();

  if (!rotation) {
    return createSectionOgImage({
      section: "Rotations",
      description: "Rotation not found",
    });
  }

  const [{ data: profile }, { data: spec }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("handle")
      .eq("id", rotation.userId)
      .single(),
    supabase
      .schema("raw_dbc")
      .from("chr_specialization")
      .select("Name_lang, ClassID")
      .eq("ID", rotation.specId)
      .single(),
  ]);

  // TODO Add some shared utility for this outside hooks
  const { data: classData } = await supabase
    .schema("raw_dbc")
    .from("chr_classes")
    .select("Name_lang")
    .eq("ID", spec?.ClassID || -1)
    .single();

  return createRotationOgImage({
    name: rotation.name,
    description: rotation.description,
    className: classData?.Name_lang ?? "Unknown",
    specName: spec?.Name_lang ?? "Unknown",
    author: profile?.handle ?? "Unknown",
    version: rotation.currentVersion ?? 1,
    updatedAt: formatDate(rotation.updatedAt, "MMM d, yyyy"),
  });
}
