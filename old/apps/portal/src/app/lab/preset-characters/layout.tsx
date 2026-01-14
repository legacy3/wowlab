import { PageLayout } from "@/components/page";

export default function PresetCharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Preset Characters"
      description="Default character profiles used when no custom character is provided."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Lab", href: "/lab" },
        { label: "Preset Characters" },
      ]}
    >
      {children}
    </PageLayout>
  );
}
