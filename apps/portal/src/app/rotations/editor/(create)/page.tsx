import { RotationEditor } from "@/components/rotation-editor";

interface Props {
  searchParams: Promise<{ specId?: string }>;
}

export default async function CreateRotationPage({ searchParams }: Props) {
  const { specId } = await searchParams;
  const specIdNum = specId ? parseInt(specId, 10) : 253; // Default to BM Hunter

  async function handleSave() {
    "use server";
    // TODO: Save to DB
  }

  return (
    <RotationEditor rotation={null} specId={specIdNum} onSave={handleSave} />
  );
}
