import { notFound } from "next/navigation";
import { RotationEditor } from "@/components/rotation-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRotationPage({ params }: Props) {
  const { id } = await params;

  // TODO: Fetch rotation from DB
  // const rotation = await getRotation(id);
  // if (!rotation) {
  //   notFound();
  // }

  // For now, just render with null (will be new rotation mode)
  const rotation = null;

  async function handleSave() {
    "use server";
    // TODO: Update in DB
  }

  return (
    <RotationEditor
      rotation={rotation}
      onSave={handleSave}
    />
  );
}
